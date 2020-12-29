import {createClient} from "@remixproject/plugin-iframe";
import {PluginClient} from "@remixproject/plugin";
import axios, {AxiosInstance} from "axios";
import {Account, Network, Project} from "./types/Api";
import {Verification} from "./types/Verify";
import upath from 'upath';

const networksToIgnore: { [id: string]: boolean } = {
    "d5cffec2-af1e-4d7e-9406-feb235a578de": true,
};

class RemixClient extends PluginClient {
    methods = [];
    client: any;

    axiosClient: AxiosInstance;

    username: string = "";
    projectSlug: string = "";

    constructor() {
        super();
        this.client = createClient(this);

        this.axiosClient = axios.create({
            baseURL: process.env.REACT_APP_TENDERLY_API_URL,
        })
    }

    public async getProjects(): Promise<Project[]> {
        try {
            const response = await this.axiosClient.get("/account/me/projects");

            return response.data.projects;
        } catch (e) {
            console.log("Couldn't fetch projects: ", e);
        }

        return [];
    }

    public async getNetworks(): Promise<Network[]> {
        const networks: Network[] = [];

        try {
            const response = await this.axiosClient.get("/public-networks");

            for (const network of response.data) {
                if (networksToIgnore[network.id]) {
                    continue;
                }

                networks.push(network);
            }
        } catch (e) {
            console.log("Couldn't fetch networks: ", e);
        }

        networks.sort(((a, b) => a.id <= b.id ? -1 : 1));

        return networks;
    }

    public async fetchLastCompilation(contractName: string): Promise<Verification | undefined> {
        const result = await this.client.call('solidity', 'getCompilationResult');

        if (!result.data || !result.source) {
            return undefined;
        }

        let metadata: any;
        const target = result.source.target;

        const contractFileName = result.source.target.replace("browser/", "/");
        const sol = result.source.sources[target.toString()].content;

        Object.keys(result.data.contracts).forEach(key => {
            if (!result.data.contracts[key][contractName].metadata) {
                return;
            }

            metadata = JSON.parse(result.data.contracts[key][contractName].metadata);
        });

        if (!metadata || !contractName) {
            return undefined;
        }

        return {
            config: {
                evm_version: metadata.settings.evmVersion,
                optimizations_used: metadata.settings.optimizer.enabled,
                optimizations_count: metadata.settings.optimizer.runs,
            },
            contracts: [
                {
                    compiler: {
                        name: "solc",
                        version: metadata.compiler.version,
                    },
                    contractName: contractName,
                    networks: {},
                    source: sol,
                    sourcePath: contractFileName,
                }
            ],
        };
    }

    public async verify(verification: Verification): Promise<boolean> {
        try {
            const response = await this.axiosClient.post("/account/me/verify-contracts", verification);

            if (!!response.data.bytecode_mismatch_errors) {
                console.log("Got bytecode mismatch: ", response.data.bytecode_mismatch_errors);
                throw new Error("Bytecode mismatch")
            }
        } catch (e) {
            console.log("Couldn't verify contract: ", e)
            return false;
        }

        return true;
    }

    public async addToProject(networkID: string, address: string): Promise<boolean> {
        try {
            await this.axiosClient.post(`/account/${this.username}/project/${this.projectSlug}/address`, {
                network_id: networkID,
                address: address,
            });
        } catch (e) {
            console.log("Couldn't add contract to project: ", e);
            return false;
        }

        return true;
    }

    public async getContracts(): Promise<Account[]> {
        try {
            const response = await this.axiosClient.get(`/account/${this.username}/project/${this.projectSlug}/contracts`);
            return response.data;
        } catch (e) {
            console.log("Couldn't fetch contracts from project: ", e);
            return [];
        }
    }

    public async getContract(networkID: string, address: string): Promise<Account | undefined> {
        try {
            const response = await this.axiosClient.get(`/account/${this.username}/project/${this.projectSlug}/contract/${networkID}/${address}`);

            return response.data;
        } catch (e) {
            console.log("Couldn't get contract from project: ", e);
            return undefined;
        }
    }

    public async importContract(name: string, source: string): Promise<void> {
        this.client.call('fileManager', 'setFile', upath.join('tenderly', this.projectSlug, name), source);
    }

    public setAccessToken(accessToken: string): void {
        this.axiosClient.defaults.headers.common['X-Access-Key'] = accessToken;
    }

    public setProject(projectSlug: string, username: string): void {
        this.projectSlug = projectSlug;
        this.username = username;
    }
}

const client = new RemixClient()

export default client;
