export interface Project {
    id: string;
    name: string;
    slug: string;
    owner_id: string;
    owner: ProjectOwner;
}

type OwnerType = "user" | "organization";

export interface ProjectOwner {
    id: string;
    username: string;
    type: OwnerType;
}

export interface Network {
    id: string;
    name: string;
}


export interface Account {
    id: string;
    contract: Contract;
    project: Project;
    display_name: string;
}

export interface Contract {
    id: string;
    contract_id: string;
    network_id: string;
    address: string;
    contract_name: string;
    number_of_files: number;
    data: ContractData;
}

export interface ContractData {
    contract_info: ContractInfo[];
}

export interface ContractInfo {
    id: number;
    name: string;
    path: string;
    source: string;
}
