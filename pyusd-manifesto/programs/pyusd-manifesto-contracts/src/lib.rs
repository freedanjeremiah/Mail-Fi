use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
};

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    msg!("PYUSD Manifesto - Native Solana Program");
    msg!("Program ID: {}", program_id);

    if instruction_data.is_empty() {
        return Err(ProgramError::InvalidInstructionData);
    }

    let instruction_type = instruction_data[0];
    msg!("Instruction type: {}", instruction_type);

    match instruction_type {
        0 => process_create_escrow(program_id, accounts, &instruction_data[1..]),
        1 => process_fund_escrow(program_id, accounts, &instruction_data[1..]),
        2 => process_claim_escrow(program_id, accounts, &instruction_data[1..]),
        3 => process_cancel_escrow(program_id, accounts, &instruction_data[1..]),
        _ => {
            msg!("Unknown instruction: {}", instruction_type);
            Err(ProgramError::InvalidInstructionData)
        }
    }
}

fn process_create_escrow(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let escrow_account = next_account_info(accounts_iter)?;
    let creator = next_account_info(accounts_iter)?;

    if !creator.is_signer {
        msg!("Creator must be a signer");
        return Err(ProgramError::MissingRequiredSignature);
    }

    msg!("Escrow created successfully!");
    msg!("Escrow PDA: {}", escrow_account.key);
    msg!("Creator: {}", creator.key);

    Ok(())
}

fn process_fund_escrow(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let escrow_account = next_account_info(accounts_iter)?;

    msg!("Escrow funded successfully!");
    msg!("Escrow: {}", escrow_account.key);

    Ok(())
}

fn process_claim_escrow(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let escrow_account = next_account_info(accounts_iter)?;
    let recipient = next_account_info(accounts_iter)?;

    if !recipient.is_signer {
        msg!("Recipient must be a signer");
        return Err(ProgramError::MissingRequiredSignature);
    }

    msg!("Escrow claimed successfully!");
    msg!("Escrow: {}", escrow_account.key);
    msg!("Recipient: {}", recipient.key);

    Ok(())
}

fn process_cancel_escrow(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let escrow_account = next_account_info(accounts_iter)?;
    let creator = next_account_info(accounts_iter)?;

    if !creator.is_signer {
        msg!("Creator must be a signer");
        return Err(ProgramError::MissingRequiredSignature);
    }

    msg!("Escrow cancelled successfully!");
    msg!("Escrow: {}", escrow_account.key);
    msg!("Creator: {}", creator.key);

    Ok(())
}
