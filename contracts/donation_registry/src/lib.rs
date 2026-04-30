#![no_std]

mod small_livestock;
mod types;

use soroban_sdk::{contract, contractimpl, Address, Env, String, Symbol};

pub use small_livestock::SmallLivestockDonation;
pub use types::{
    AnimalType, DataKey, DonationEvent, LivestockDataKey, LivestockDonationEvent, LivestockTotals,
};

#[contract]
pub struct DonationRegistry;

fn empty_livestock_totals() -> LivestockTotals {
    LivestockTotals {
        amount_stroops: 0,
        units: 0,
        count: 0,
    }
}

fn read_livestock_totals(env: &Env, key: &LivestockDataKey) -> LivestockTotals {
    env.storage()
        .persistent()
        .get::<LivestockDataKey, LivestockTotals>(key)
        .unwrap_or_else(empty_livestock_totals)
}

#[contractimpl]
impl DonationRegistry {
    pub fn donate(env: Env, donor: Address, program: Symbol, amount_stroops: i128, memo: String) {
        donor.require_auth();

        if amount_stroops <= 0 {
            panic!("amount must be positive");
        }

        let total_key = DataKey::Total(program.clone());
        let donor_key = DataKey::DonorTotal(donor.clone(), program.clone());
        let count_key = DataKey::Count(program.clone());

        let total = env
            .storage()
            .persistent()
            .get::<DataKey, i128>(&total_key)
            .unwrap_or(0);
        let donor_total = env
            .storage()
            .persistent()
            .get::<DataKey, i128>(&donor_key)
            .unwrap_or(0);
        let count = env
            .storage()
            .persistent()
            .get::<DataKey, u32>(&count_key)
            .unwrap_or(0);

        env.storage()
            .persistent()
            .set(&total_key, &(total + amount_stroops));
        env.storage()
            .persistent()
            .set(&donor_key, &(donor_total + amount_stroops));
        env.storage().persistent().set(&count_key, &(count + 1));

        DonationEvent {
            program,
            donor,
            amount_stroops,
            memo,
        }
        .publish(&env);
    }

    pub fn get_total(env: Env, program: Symbol) -> i128 {
        env.storage()
            .persistent()
            .get::<DataKey, i128>(&DataKey::Total(program))
            .unwrap_or(0)
    }

    pub fn get_donor_total(env: Env, donor: Address, program: Symbol) -> i128 {
        env.storage()
            .persistent()
            .get::<DataKey, i128>(&DataKey::DonorTotal(donor, program))
            .unwrap_or(0)
    }

    pub fn get_count(env: Env, program: Symbol) -> u32 {
        env.storage()
            .persistent()
            .get::<DataKey, u32>(&DataKey::Count(program))
            .unwrap_or(0)
    }
}

#[contractimpl]
impl SmallLivestockDonation for DonationRegistry {
    fn donate_livestock(
        env: Env,
        donor: Address,
        program: Symbol,
        animal_type: AnimalType,
        units: u32,
        amount_stroops: i128,
        memo: String,
    ) {
        donor.require_auth();

        if units == 0 {
            panic!("units must be positive");
        }

        if amount_stroops <= 0 {
            panic!("amount must be positive");
        }

        let total_key = LivestockDataKey::Total(program.clone(), animal_type.clone());
        let donor_key =
            LivestockDataKey::DonorTotal(donor.clone(), program.clone(), animal_type.clone());
        let count_key = LivestockDataKey::Count(program.clone(), animal_type.clone());

        let total = read_livestock_totals(&env, &total_key);
        let donor_total = read_livestock_totals(&env, &donor_key);
        let count = env
            .storage()
            .persistent()
            .get::<LivestockDataKey, u32>(&count_key)
            .unwrap_or(0);

        env.storage().persistent().set(
            &total_key,
            &LivestockTotals {
                amount_stroops: total.amount_stroops + amount_stroops,
                units: total.units + units,
                count: total.count + 1,
            },
        );
        env.storage().persistent().set(
            &donor_key,
            &LivestockTotals {
                amount_stroops: donor_total.amount_stroops + amount_stroops,
                units: donor_total.units + units,
                count: donor_total.count + 1,
            },
        );
        env.storage().persistent().set(&count_key, &(count + 1));

        LivestockDonationEvent {
            program,
            animal_type,
            donor,
            units,
            amount_stroops,
            memo,
        }
        .publish(&env);
    }

    fn get_livestock_total(env: Env, program: Symbol, animal_type: AnimalType) -> LivestockTotals {
        read_livestock_totals(&env, &LivestockDataKey::Total(program, animal_type))
    }

    fn get_livestock_donor_total(
        env: Env,
        donor: Address,
        program: Symbol,
        animal_type: AnimalType,
    ) -> LivestockTotals {
        read_livestock_totals(
            &env,
            &LivestockDataKey::DonorTotal(donor, program, animal_type),
        )
    }

    fn get_livestock_count(env: Env, program: Symbol, animal_type: AnimalType) -> u32 {
        env.storage()
            .persistent()
            .get::<LivestockDataKey, u32>(&LivestockDataKey::Count(program, animal_type))
            .unwrap_or(0)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{symbol_short, testutils::Address as _, Env, String};

    #[test]
    fn records_program_and_donor_totals() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(DonationRegistry, ());
        let client = DonationRegistryClient::new(&env, &contract_id);
        let donor = Address::generate(&env);
        let program = symbol_short!("qurban");

        client.donate(
            &donor,
            &program,
            &25_000_000,
            &String::from_str(&env, "test donation"),
        );
        client.donate(
            &donor,
            &program,
            &15_000_000,
            &String::from_str(&env, "second"),
        );

        assert_eq!(client.get_total(&program), 40_000_000);
        assert_eq!(client.get_donor_total(&donor, &program), 40_000_000);
        assert_eq!(client.get_count(&program), 2);
    }

    #[test]
    fn records_livestock_totals_by_program_and_animal_type() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(DonationRegistry, ());
        let client = DonationRegistryClient::new(&env, &contract_id);
        let donor = Address::generate(&env);
        let program = symbol_short!("qurban");

        client.donate_livestock(
            &donor,
            &program,
            &AnimalType::Sheep,
            &2,
            &50_000_000,
            &String::from_str(&env, "two sheep"),
        );
        client.donate_livestock(
            &donor,
            &program,
            &AnimalType::Sheep,
            &1,
            &25_000_000,
            &String::from_str(&env, "one more"),
        );
        client.donate_livestock(
            &donor,
            &program,
            &AnimalType::Goat,
            &1,
            &30_000_000,
            &String::from_str(&env, "goat"),
        );

        assert_eq!(
            client.get_livestock_total(&program, &AnimalType::Sheep),
            LivestockTotals {
                amount_stroops: 75_000_000,
                units: 3,
                count: 2,
            }
        );
        assert_eq!(
            client.get_livestock_total(&program, &AnimalType::Goat),
            LivestockTotals {
                amount_stroops: 30_000_000,
                units: 1,
                count: 1,
            }
        );
        assert_eq!(client.get_livestock_count(&program, &AnimalType::Sheep), 2);
    }

    #[test]
    fn keeps_livestock_donor_totals_separate() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(DonationRegistry, ());
        let client = DonationRegistryClient::new(&env, &contract_id);
        let donor_a = Address::generate(&env);
        let donor_b = Address::generate(&env);
        let program = symbol_short!("qurban");

        client.donate_livestock(
            &donor_a,
            &program,
            &AnimalType::Sheep,
            &2,
            &50_000_000,
            &String::from_str(&env, "donor a"),
        );
        client.donate_livestock(
            &donor_b,
            &program,
            &AnimalType::Sheep,
            &1,
            &25_000_000,
            &String::from_str(&env, "donor b"),
        );

        assert_eq!(
            client.get_livestock_donor_total(&donor_a, &program, &AnimalType::Sheep),
            LivestockTotals {
                amount_stroops: 50_000_000,
                units: 2,
                count: 1,
            }
        );
        assert_eq!(
            client.get_livestock_donor_total(&donor_b, &program, &AnimalType::Sheep),
            LivestockTotals {
                amount_stroops: 25_000_000,
                units: 1,
                count: 1,
            }
        );
    }

    #[test]
    #[should_panic(expected = "units must be positive")]
    fn rejects_zero_livestock_units() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(DonationRegistry, ());
        let client = DonationRegistryClient::new(&env, &contract_id);
        let donor = Address::generate(&env);
        let program = symbol_short!("qurban");

        client.donate_livestock(
            &donor,
            &program,
            &AnimalType::Sheep,
            &0,
            &25_000_000,
            &String::from_str(&env, "bad units"),
        );
    }

    #[test]
    #[should_panic(expected = "amount must be positive")]
    fn rejects_non_positive_livestock_amount() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(DonationRegistry, ());
        let client = DonationRegistryClient::new(&env, &contract_id);
        let donor = Address::generate(&env);
        let program = symbol_short!("qurban");

        client.donate_livestock(
            &donor,
            &program,
            &AnimalType::Goat,
            &1,
            &0,
            &String::from_str(&env, "bad amount"),
        );
    }
}
