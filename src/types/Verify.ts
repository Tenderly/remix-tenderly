export interface Verification {
    config: VerificationConfig;
    contracts: ContractVerification[];
}

export interface VerificationConfig {
    optimizations_used: boolean;
    optimizations_count: number;
    evm_version: string;
}

export interface ContractVerification {
    contractName: string;
    source: string;
    sourcePath: string;
    compiler: ContractVerificationCompiler;
    networks: { [networkId: string]: VerificationAddressMapping };
}

export interface ContractVerificationCompiler {
    name: string;
    version: string;
}


export interface VerificationAddressMapping {
    address: string;
    links: any;
}
