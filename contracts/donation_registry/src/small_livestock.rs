use soroban_sdk::{contracttrait, Address, Env, String, Symbol};

use crate::types::{AnimalType, LivestockTotals};

#[contracttrait]
pub trait SmallLivestockDonation {
    fn donate_livestock(
        env: Env,
        donor: Address,
        program: Symbol,
        animal_type: AnimalType,
        units: u32,
        amount_stroops: i128,
        memo: String,
    );

    fn get_livestock_total(
        env: Env,
        program: Symbol,
        animal_type: AnimalType,
    ) -> LivestockTotals;

    fn get_livestock_donor_total(
        env: Env,
        donor: Address,
        program: Symbol,
        animal_type: AnimalType,
    ) -> LivestockTotals;

    fn get_livestock_count(env: Env, program: Symbol, animal_type: AnimalType) -> u32;
}
