use soroban_sdk::{contractevent, contracttype, Address, String, Symbol};

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

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum AnimalType {
    Sheep,
    Goat,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LivestockTotals {
    pub amount_stroops: i128,
    pub units: u32,
    pub count: u32,
}

#[contracttype]
#[derive(Clone)]
pub enum LivestockDataKey {
    Total(Symbol, AnimalType),
    DonorTotal(Address, Symbol, AnimalType),
    Count(Symbol, AnimalType),
}

#[contractevent(topics = ["livestock"])]
#[derive(Clone, Debug)]
pub struct LivestockDonationEvent {
    #[topic]
    pub program: Symbol,
    #[topic]
    pub animal_type: AnimalType,
    #[topic]
    pub donor: Address,
    pub units: u32,
    pub amount_stroops: i128,
    pub memo: String,
}
