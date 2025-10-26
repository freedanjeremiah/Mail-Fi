use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program::{invoke, invoke_signed},
    program_error::ProgramError,
    program_pack::Pack,
    pubkey::Pubkey,
    rent::Rent,
    system_instruction,
    sysvar::Sysvar,
};

// Declare modules
pub mod escrow;
pub mod multisig;
pub mod recurring;
pub mod yield_farming;

use escrow::*;
use multisig::*;
use recurring::*;
use yield_farming::*;

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    msg!("PYUSD Manifesto - Native Solana Program");
    msg!("Program ID: {}", program_id);

    if instruction_data.len() < 8 {
        return Err(ProgramError::InvalidInstructionData);
    }

    // First 8 bytes are the discriminator
    let discriminator = &instruction_data[0..8];
    let data = &instruction_data[8..];

    msg!("Discriminator: {:?}", discriminator);

    match discriminator {
        // Escrow instructions
        [0xfd, 0xd7, 0xa5, 0x74, 0x24, 0x6c, 0x44, 0x50] => {
            msg!("Instruction: Create Escrow");
            process_create_escrow(program_id, accounts, data)
        }
        [0x9b, 0x12, 0xda, 0x8d, 0xb6, 0xd5, 0x45, 0xc9] => {
            msg!("Instruction: Fund Escrow");
            process_fund_escrow(program_id, accounts, data)
        }
        [0xc8, 0x50, 0xb6, 0x9f, 0x3d, 0x4b, 0x09, 0xcd] => {
            msg!("Instruction: Claim Escrow");
            process_claim_escrow(program_id, accounts, data)
        }
        [0x9c, 0xcb, 0x36, 0xb3, 0x26, 0x48, 0x21, 0x15] => {
            msg!("Instruction: Cancel Escrow");
            process_cancel_escrow(program_id, accounts, data)
        }

        // Multisig instructions
        [0x9c, 0x32, 0x7e, 0x9b, 0x5d, 0x4f, 0x8a, 0x12] => {
            msg!("Instruction: Create Multisig");
            process_create_multisig(program_id, accounts, data)
        }
        [0x7a, 0x3d, 0x8e, 0x6f, 0x1c, 0x9b, 0x4a, 0x5d] => {
            msg!("Instruction: Propose Transaction");
            process_propose_transaction(program_id, accounts, data)
        }
        [0x3b, 0x8f, 0x2d, 0x6a, 0x7e, 0x1c, 0x9d, 0x4f] => {
            msg!("Instruction: Approve Transaction");
            process_approve_transaction(program_id, accounts, data)
        }
        [0x5c, 0x9a, 0x3f, 0x7b, 0x2e, 0x6d, 0x1a, 0x8c] => {
            msg!("Instruction: Execute Transaction");
            process_execute_transaction(program_id, accounts, data)
        }
        [0x4d, 0x7e, 0x2b, 0x9f, 0x3c, 0x8a, 0x5d, 0x1e] => {
            msg!("Instruction: Reject Transaction");
            process_reject_transaction(program_id, accounts, data)
        }

        // Yield Farming instructions
        [0x95, 0xc0, 0xa0, 0xfe, 0xf8, 0x6c, 0x5c, 0x9d] => {
            msg!("Instruction: Initialize Staking Pool");
            process_initialize_staking_pool(program_id, accounts, data)
        }
        [0xf2, 0xc7, 0x7e, 0x4d, 0x7d, 0x5e, 0x5b, 0xa9] => {
            msg!("Instruction: Stake");
            process_stake(program_id, accounts, data)
        }
        [0x62, 0x19, 0x8f, 0x6e, 0x9f, 0x30, 0x8b, 0x1a] => {
            msg!("Instruction: Claim Rewards");
            process_claim_rewards(program_id, accounts, data)
        }
        [0x90, 0x95, 0xeb, 0xf9, 0xfe, 0xfd, 0x90, 0x66] => {
            msg!("Instruction: Unstake");
            process_unstake(program_id, accounts, data)
        }
        [0x8b, 0x7f, 0xd6, 0x4e, 0xa7, 0x5f, 0x3c, 0x2d] => {
            msg!("Instruction: Compound Rewards");
            process_compound_rewards(program_id, accounts, data)
        }

        // Recurring Payments instructions
        [0x6a, 0x4e, 0x8f, 0x3d, 0x9c, 0x7b, 0x2a, 0x5f] => {
            msg!("Instruction: Create Recurring Payment");
            process_create_recurring_payment(program_id, accounts, data)
        }
        [0x7b, 0x5f, 0x9e, 0x4c, 0x8d, 0x6a, 0x3b, 0x1e] => {
            msg!("Instruction: Execute Recurring Payment");
            process_execute_recurring_payment(program_id, accounts, data)
        }
        [0x8c, 0x6d, 0x9f, 0x5b, 0x7e, 0x4a, 0x2c, 0x1d] => {
            msg!("Instruction: Cancel Recurring Payment");
            process_cancel_recurring_payment(program_id, accounts, data)
        }

        _ => {
            msg!("Unknown instruction discriminator: {:?}", discriminator);
            Err(ProgramError::InvalidInstructionData)
        }
    }
}
