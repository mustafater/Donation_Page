#![no_std]

use soroban_sdk::{
    contract, contractevent, contractimpl, contracttype, Address, Env, String, Symbol,
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Total(Symbol),
    DonorTotal(Address, Symbol),
    Count(Symbol),
}

#[contractevent(topics = ["donation"])]
#[derive(Clone, Debug)]
pub struct DonationEvent {
    #[topic]
    pub program: Symbol,
    #[topic]
    pub donor: Address,
    pub amount_stroops: i128,
    pub memo: String,
}

#[contract]
pub struct DonationRegistry;

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
}
