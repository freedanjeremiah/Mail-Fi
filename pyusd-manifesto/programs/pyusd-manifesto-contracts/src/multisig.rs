use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    clock::Clock,
    entrypoint::ProgramResult,
    msg,
    program::{invoke, invoke_signed},
    program_error::ProgramError,
    pubkey::Pubkey,
    rent::Rent,
    system_instruction,
    sysvar::Sysvar,
};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct Multisig {
    pub creator: Pubkey,
    pub owners: Vec<Pubkey>,
    pub threshold: u8,
    pub transaction_count: u64,
    pub created_at: i64,
    pub bump: u8,
}

impl Multisig {
    pub const MAX_OWNERS: usize = 10;
    pub const MAX_SIZE: usize = 32 + 4 + (32 * Self::MAX_OWNERS) + 1 + 8 + 8 + 1; // ~410 bytes
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct MultisigTransaction {
    pub multisig: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub transaction_index: u64,
    pub approvals: Vec<Pubkey>,
    pub executed: bool,
    pub proposer: Pubkey,
    pub created_at: i64,
    pub description: String,
    pub bump: u8,
}

impl MultisigTransaction {
    pub const MAX_SIZE: usize = 32 + 32 + 8 + 8 + 4 + (32 * 10) + 1 + 32 + 8 + 4 + 100 + 1; // ~550 bytes
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct CreateMultisigArgs {
    pub owners: Vec<Pubkey>,
    pub threshold: u8,
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct ProposeTransactionArgs {
    pub amount: u64,
    pub recipient: Pubkey,
    pub description: String,
}

pub fn process_create_multisig(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();

    let multisig_account = next_account_info(accounts_iter)?;
    let creator = next_account_info(accounts_iter)?;
    let system_program = next_account_info(accounts_iter)?;

    if !creator.is_signer {
        msg!("Creator must be a signer");
        return Err(ProgramError::MissingRequiredSignature);
    }

    let args = CreateMultisigArgs::try_from_slice(instruction_data)
        .map_err(|_| ProgramError::InvalidInstructionData)?;

    // Validate owners and threshold
    if args.owners.is_empty() || args.owners.len() > Multisig::MAX_OWNERS {
        msg!("Invalid number of owners");
        return Err(ProgramError::InvalidArgument);
    }

    if args.threshold == 0 || args.threshold as usize > args.owners.len() {
        msg!("Invalid threshold");
        return Err(ProgramError::InvalidArgument);
    }

    let clock = Clock::get()?;
    let current_time = clock.unix_timestamp;

    // Derive PDA
    let (multisig_pda, bump) = Pubkey::find_program_address(
        &[
            b"multisig",
            creator.key.as_ref(),
            &current_time.to_le_bytes(),
        ],
        program_id,
    );

    if multisig_pda != *multisig_account.key {
        msg!("Invalid multisig PDA");
        return Err(ProgramError::InvalidArgument);
    }

    // Create multisig account
    let rent = Rent::get()?;
    let space = Multisig::MAX_SIZE;
    let lamports = rent.minimum_balance(space);

    invoke_signed(
        &system_instruction::create_account(
            creator.key,
            multisig_account.key,
            lamports,
            space as u64,
            program_id,
        ),
        &[creator.clone(), multisig_account.clone(), system_program.clone()],
        &[&[
            b"multisig",
            creator.key.as_ref(),
            &current_time.to_le_bytes(),
            &[bump],
        ]],
    )?;

    // Initialize multisig data
    let multisig_data = Multisig {
        creator: *creator.key,
        owners: args.owners,
        threshold: args.threshold,
        transaction_count: 0,
        created_at: current_time,
        bump,
    };

    multisig_data.serialize(&mut &mut multisig_account.data.borrow_mut()[..])?;

    msg!("Multisig created successfully!");
    msg!("Multisig PDA: {}", multisig_account.key);

    Ok(())
}

pub fn process_propose_transaction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();

    let multisig_account = next_account_info(accounts_iter)?;
    let transaction_account = next_account_info(accounts_iter)?;
    let proposer = next_account_info(accounts_iter)?;
    let system_program = next_account_info(accounts_iter)?;

    if !proposer.is_signer {
        msg!("Proposer must be a signer");
        return Err(ProgramError::MissingRequiredSignature);
    }

    let args = ProposeTransactionArgs::try_from_slice(instruction_data)
        .map_err(|_| ProgramError::InvalidInstructionData)?;

    // Load multisig
    let mut multisig_data = Multisig::try_from_slice(&multisig_account.data.borrow())
        .map_err(|_| ProgramError::InvalidAccountData)?;

    // Verify proposer is an owner
    if !multisig_data.owners.contains(proposer.key) {
        msg!("Proposer is not an owner");
        return Err(ProgramError::InvalidAccountData);
    }

    let transaction_index = multisig_data.transaction_count;
    let clock = Clock::get()?;

    // Derive transaction PDA
    let (transaction_pda, bump) = Pubkey::find_program_address(
        &[
            b"transaction",
            multisig_account.key.as_ref(),
            &transaction_index.to_le_bytes(),
        ],
        program_id,
    );

    if transaction_pda != *transaction_account.key {
        msg!("Invalid transaction PDA");
        return Err(ProgramError::InvalidArgument);
    }

    // Create transaction account
    let rent = Rent::get()?;
    let space = MultisigTransaction::MAX_SIZE;
    let lamports = rent.minimum_balance(space);

    invoke_signed(
        &system_instruction::create_account(
            proposer.key,
            transaction_account.key,
            lamports,
            space as u64,
            program_id,
        ),
        &[proposer.clone(), transaction_account.clone(), system_program.clone()],
        &[&[
            b"transaction",
            multisig_account.key.as_ref(),
            &transaction_index.to_le_bytes(),
            &[bump],
        ]],
    )?;

    // Initialize transaction data
    let transaction_data = MultisigTransaction {
        multisig: *multisig_account.key,
        recipient: args.recipient,
        amount: args.amount,
        transaction_index,
        approvals: vec![*proposer.key], // Proposer auto-approves
        executed: false,
        proposer: *proposer.key,
        created_at: clock.unix_timestamp,
        description: args.description,
        bump,
    };

    transaction_data.serialize(&mut &mut transaction_account.data.borrow_mut()[..])?;

    // Increment transaction count
    multisig_data.transaction_count += 1;
    multisig_data.serialize(&mut &mut multisig_account.data.borrow_mut()[..])?;

    msg!("Transaction proposed successfully!");
    msg!("Transaction index: {}", transaction_index);

    Ok(())
}

pub fn process_approve_transaction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();

    let multisig_account = next_account_info(accounts_iter)?;
    let transaction_account = next_account_info(accounts_iter)?;
    let approver = next_account_info(accounts_iter)?;

    if !approver.is_signer {
        msg!("Approver must be a signer");
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Load multisig
    let multisig_data = Multisig::try_from_slice(&multisig_account.data.borrow())
        .map_err(|_| ProgramError::InvalidAccountData)?;

    // Verify approver is an owner
    if !multisig_data.owners.contains(approver.key) {
        msg!("Approver is not an owner");
        return Err(ProgramError::InvalidAccountData);
    }

    // Load transaction
    let mut transaction_data = MultisigTransaction::try_from_slice(&transaction_account.data.borrow())
        .map_err(|_| ProgramError::InvalidAccountData)?;

    if transaction_data.executed {
        msg!("Transaction already executed");
        return Err(ProgramError::InvalidAccountData);
    }

    // Check if already approved
    if transaction_data.approvals.contains(approver.key) {
        msg!("Already approved by this owner");
        return Err(ProgramError::InvalidAccountData);
    }

    // Add approval
    transaction_data.approvals.push(*approver.key);
    transaction_data.serialize(&mut &mut transaction_account.data.borrow_mut()[..])?;

    msg!("Transaction approved!");
    msg!("Total approvals: {}", transaction_data.approvals.len());

    Ok(())
}

pub fn process_execute_transaction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();

    let multisig_account = next_account_info(accounts_iter)?;
    let transaction_account = next_account_info(accounts_iter)?;
    let multisig_token_account = next_account_info(accounts_iter)?;
    let recipient_token_account = next_account_info(accounts_iter)?;
    let executor = next_account_info(accounts_iter)?;
    let token_program = next_account_info(accounts_iter)?;

    if !executor.is_signer {
        msg!("Executor must be a signer");
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Load multisig
    let multisig_data = Multisig::try_from_slice(&multisig_account.data.borrow())
        .map_err(|_| ProgramError::InvalidAccountData)?;

    // Load transaction
    let mut transaction_data = MultisigTransaction::try_from_slice(&transaction_account.data.borrow())
        .map_err(|_| ProgramError::InvalidAccountData)?;

    if transaction_data.executed {
        msg!("Transaction already executed");
        return Err(ProgramError::InvalidAccountData);
    }

    // Check if threshold met
    if transaction_data.approvals.len() < multisig_data.threshold as usize {
        msg!("Threshold not met");
        return Err(ProgramError::InvalidAccountData);
    }

    // Execute transfer
    let transfer_instruction = spl_token_2022::instruction::transfer_checked(
        token_program.key,
        multisig_token_account.key,
        &spl_token_2022::id(),
        recipient_token_account.key,
        multisig_account.key, // PDA authority
        &[],
        transaction_data.amount,
        6,
    )?;

    invoke_signed(
        &transfer_instruction,
        &[
            multisig_token_account.clone(),
            recipient_token_account.clone(),
            multisig_account.clone(),
            token_program.clone(),
        ],
        &[&[
            b"multisig",
            multisig_data.creator.as_ref(),
            &multisig_data.created_at.to_le_bytes(),
            &[multisig_data.bump],
        ]],
    )?;

    // Mark as executed
    transaction_data.executed = true;
    transaction_data.serialize(&mut &mut transaction_account.data.borrow_mut()[..])?;

    msg!("Transaction executed successfully!");

    Ok(())
}

pub fn process_reject_transaction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();

    let transaction_account = next_account_info(accounts_iter)?;
    let multisig_account = next_account_info(accounts_iter)?;
    let rejecter = next_account_info(accounts_iter)?;

    if !rejecter.is_signer {
        msg!("Rejecter must be a signer");
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Load multisig
    let multisig_data = Multisig::try_from_slice(&multisig_account.data.borrow())
        .map_err(|_| ProgramError::InvalidAccountData)?;

    // Verify rejecter is an owner
    if !multisig_data.owners.contains(rejecter.key) {
        msg!("Rejecter is not an owner");
        return Err(ProgramError::InvalidAccountData);
    }

    // Load transaction
    let transaction_data = MultisigTransaction::try_from_slice(&transaction_account.data.borrow())
        .map_err(|_| ProgramError::InvalidAccountData)?;

    if transaction_data.executed {
        msg!("Cannot reject executed transaction");
        return Err(ProgramError::InvalidAccountData);
    }

    msg!("Transaction rejected - account can be closed");

    Ok(())
}
