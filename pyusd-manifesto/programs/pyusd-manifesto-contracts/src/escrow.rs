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
pub struct EscrowAccount {
    pub creator: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub created_at: i64,
    pub expiry_time: i64,
    pub is_funded: bool,
    pub is_claimed: bool,
    pub description: String,
    pub bump: u8,
}

impl EscrowAccount {
    pub const MAX_SIZE: usize = 32 + 32 + 8 + 8 + 8 + 1 + 1 + 4 + 100 + 1; // ~195 bytes
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct CreateEscrowArgs {
    pub amount: u64,
    pub recipient: Pubkey,
    pub expiry_time: i64,
    pub description: String,
}

pub fn process_create_escrow(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();

    let escrow_account = next_account_info(accounts_iter)?;
    let creator = next_account_info(accounts_iter)?;
    let system_program = next_account_info(accounts_iter)?;

    if !creator.is_signer {
        msg!("Creator must be a signer");
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Deserialize instruction data
    let args = CreateEscrowArgs::try_from_slice(instruction_data)
        .map_err(|_| ProgramError::InvalidInstructionData)?;

    msg!("Creating escrow with amount: {}", args.amount);
    msg!("Recipient: {}", args.recipient);
    msg!("Expiry time: {}", args.expiry_time);

    // Get current timestamp
    let clock = Clock::get()?;
    let current_time = clock.unix_timestamp;

    // Validate expiry time
    if args.expiry_time <= current_time {
        msg!("Expiry time must be in the future");
        return Err(ProgramError::InvalidArgument);
    }

    // Derive PDA
    let (escrow_pda, bump) = Pubkey::find_program_address(
        &[
            b"escrow",
            creator.key.as_ref(),
            &current_time.to_le_bytes(),
        ],
        program_id,
    );

    if escrow_pda != *escrow_account.key {
        msg!("Invalid escrow PDA");
        return Err(ProgramError::InvalidArgument);
    }

    // Create escrow account
    let rent = Rent::get()?;
    let space = EscrowAccount::MAX_SIZE;
    let lamports = rent.minimum_balance(space);

    invoke_signed(
        &system_instruction::create_account(
            creator.key,
            escrow_account.key,
            lamports,
            space as u64,
            program_id,
        ),
        &[creator.clone(), escrow_account.clone(), system_program.clone()],
        &[&[
            b"escrow",
            creator.key.as_ref(),
            &current_time.to_le_bytes(),
            &[bump],
        ]],
    )?;

    // Initialize escrow data
    let escrow_data = EscrowAccount {
        creator: *creator.key,
        recipient: args.recipient,
        amount: args.amount,
        created_at: current_time,
        expiry_time: args.expiry_time,
        is_funded: false,
        is_claimed: false,
        description: args.description,
        bump,
    };

    escrow_data.serialize(&mut &mut escrow_account.data.borrow_mut()[..])?;

    msg!("Escrow created successfully!");
    msg!("Escrow PDA: {}", escrow_account.key);

    Ok(())
}

pub fn process_fund_escrow(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();

    let escrow_account = next_account_info(accounts_iter)?;
    let creator = next_account_info(accounts_iter)?;
    let creator_token_account = next_account_info(accounts_iter)?;
    let escrow_token_account = next_account_info(accounts_iter)?;
    let token_program = next_account_info(accounts_iter)?;

    if !creator.is_signer {
        msg!("Creator must be a signer");
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Load and validate escrow
    let mut escrow_data = EscrowAccount::try_from_slice(&escrow_account.data.borrow())
        .map_err(|_| ProgramError::InvalidAccountData)?;

    if escrow_data.creator != *creator.key {
        msg!("Only creator can fund escrow");
        return Err(ProgramError::InvalidAccountData);
    }

    if escrow_data.is_funded {
        msg!("Escrow already funded");
        return Err(ProgramError::InvalidAccountData);
    }

    // Transfer tokens to escrow
    let transfer_instruction = spl_token_2022::instruction::transfer_checked(
        token_program.key,
        creator_token_account.key,
        &spl_token_2022::id(), // mint (PYUSD)
        escrow_token_account.key,
        creator.key,
        &[],
        escrow_data.amount,
        6, // PYUSD decimals
    )?;

    invoke(
        &transfer_instruction,
        &[
            creator_token_account.clone(),
            escrow_token_account.clone(),
            creator.clone(),
            token_program.clone(),
        ],
    )?;

    // Update escrow state
    escrow_data.is_funded = true;
    escrow_data.serialize(&mut &mut escrow_account.data.borrow_mut()[..])?;

    msg!("Escrow funded successfully!");

    Ok(())
}

pub fn process_claim_escrow(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();

    let escrow_account = next_account_info(accounts_iter)?;
    let recipient = next_account_info(accounts_iter)?;
    let escrow_token_account = next_account_info(accounts_iter)?;
    let recipient_token_account = next_account_info(accounts_iter)?;
    let token_program = next_account_info(accounts_iter)?;

    if !recipient.is_signer {
        msg!("Recipient must be a signer");
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Load and validate escrow
    let mut escrow_data = EscrowAccount::try_from_slice(&escrow_account.data.borrow())
        .map_err(|_| ProgramError::InvalidAccountData)?;

    if escrow_data.recipient != *recipient.key {
        msg!("Only recipient can claim escrow");
        return Err(ProgramError::InvalidAccountData);
    }

    if !escrow_data.is_funded {
        msg!("Escrow not funded yet");
        return Err(ProgramError::InvalidAccountData);
    }

    if escrow_data.is_claimed {
        msg!("Escrow already claimed");
        return Err(ProgramError::InvalidAccountData);
    }

    // Check if expired
    let clock = Clock::get()?;
    if clock.unix_timestamp > escrow_data.expiry_time {
        msg!("Escrow has expired");
        return Err(ProgramError::InvalidAccountData);
    }

    // Transfer tokens to recipient using PDA signature
    let transfer_instruction = spl_token_2022::instruction::transfer_checked(
        token_program.key,
        escrow_token_account.key,
        &spl_token_2022::id(),
        recipient_token_account.key,
        escrow_account.key, // PDA authority
        &[],
        escrow_data.amount,
        6,
    )?;

    invoke_signed(
        &transfer_instruction,
        &[
            escrow_token_account.clone(),
            recipient_token_account.clone(),
            escrow_account.clone(),
            token_program.clone(),
        ],
        &[&[
            b"escrow",
            escrow_data.creator.as_ref(),
            &escrow_data.created_at.to_le_bytes(),
            &[escrow_data.bump],
        ]],
    )?;

    // Update escrow state
    escrow_data.is_claimed = true;
    escrow_data.serialize(&mut &mut escrow_account.data.borrow_mut()[..])?;

    msg!("Escrow claimed successfully!");

    Ok(())
}

pub fn process_cancel_escrow(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();

    let escrow_account = next_account_info(accounts_iter)?;
    let creator = next_account_info(accounts_iter)?;
    let escrow_token_account = next_account_info(accounts_iter)?;
    let creator_token_account = next_account_info(accounts_iter)?;
    let token_program = next_account_info(accounts_iter)?;

    if !creator.is_signer {
        msg!("Creator must be a signer");
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Load and validate escrow
    let mut escrow_data = EscrowAccount::try_from_slice(&escrow_account.data.borrow())
        .map_err(|_| ProgramError::InvalidAccountData)?;

    if escrow_data.creator != *creator.key {
        msg!("Only creator can cancel escrow");
        return Err(ProgramError::InvalidAccountData);
    }

    if escrow_data.is_claimed {
        msg!("Escrow already claimed");
        return Err(ProgramError::InvalidAccountData);
    }

    // Check if expired
    let clock = Clock::get()?;
    if clock.unix_timestamp <= escrow_data.expiry_time {
        msg!("Escrow has not expired yet");
        return Err(ProgramError::InvalidAccountData);
    }

    // Only refund if funded
    if escrow_data.is_funded {
        let transfer_instruction = spl_token_2022::instruction::transfer_checked(
            token_program.key,
            escrow_token_account.key,
            &spl_token_2022::id(),
            creator_token_account.key,
            escrow_account.key,
            &[],
            escrow_data.amount,
            6,
        )?;

        invoke_signed(
            &transfer_instruction,
            &[
                escrow_token_account.clone(),
                creator_token_account.clone(),
                escrow_account.clone(),
                token_program.clone(),
            ],
            &[&[
                b"escrow",
                escrow_data.creator.as_ref(),
                &escrow_data.created_at.to_le_bytes(),
                &[escrow_data.bump],
            ]],
        )?;
    }

    msg!("Escrow cancelled and refunded successfully!");

    Ok(())
}
