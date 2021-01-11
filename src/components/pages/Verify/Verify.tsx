import React, { useEffect, useState } from "react";
import { Network } from "../../../types/Api";
import RemixClient from "../../../RemixClient";
import { Alert, Button, Form } from "react-bootstrap";
import "./Verify.scss";

type Props = {
    compiledContracts: string[];
    projectSlug: string;
    username: string;
}

const networkSlugMap: { [networkID: string]: string } = {
    "1": "main",
    "3": "ropsten",
    "4": "rinkeby",
    "5": "goerli",
    "42": "kovan",
    "56": "binance",
    "97": "rialto",
    "99": "poa",
    "100": "xdai",
    "137": "matic-mainnet",
    "15001": "matic-testnetv3",
    "80001": "matic-mumbai",
};

function getNetworkSlug(networkID: string): string {
    const slug = networkSlugMap[networkID];
    if (!slug) {
        return networkID;
    }

    return slug;
}

export const Verify: React.FC<Props> = ({ compiledContracts, projectSlug, username }) => {
    const [networks, setNetworks] = useState([] as Network[]);
    const [address, setAddress] = useState("");
    const [networksMap, setNetworksMap] = useState({} as { [key: string]: Network })
    const [selectedNetwork, setSelectedNetwork] = useState("");
    const [verificationSuccessful, setVerificationSuccessful] = useState(false);
    const [selectedContract, setSelectedContract] = useState("");
    const [showAlert, setShowAlert] = useState(false);
    const [showImportAlert, setShowImportAlert] = useState(false);
    const [importSuccessful, setImportSuccessful] = useState(false);

    useEffect(() => {
        const load = async () => {
            const supportedNetworks = await RemixClient.getNetworks();
            const supportedNetworksMap: { [key: string]: Network } = {};

            for (const network of supportedNetworks) {
                supportedNetworksMap[network.id] = network;
            }

            setNetworks(supportedNetworks);
            setNetworksMap(supportedNetworksMap);
        };

        load();
    }, []);

    const onSubmit = async (event: any) => {
        event.preventDefault();

        setShowAlert(false);
        setShowImportAlert(false);

        if (!selectedContract) {
            return;
        }

        const compilationResult = await RemixClient.fetchLastCompilation(selectedContract);
        if (!compilationResult || compilationResult.contracts.length === 0) {
            setShowAlert(true);
            setVerificationSuccessful(false);
            return;
        }

        compilationResult.contracts[0].networks[selectedNetwork] = {
            address: address,
            links: {},
        }

        const success = await RemixClient.verify(compilationResult);

        setShowAlert(true)
        setVerificationSuccessful(success);
    }

    const onNetworkChange = (networkId: string) => {
        const network = networksMap[networkId];

        setShowAlert(false);
        setShowImportAlert(false);
        setVerificationSuccessful(false);
        setImportSuccessful(false);

        if (!network) {
            setSelectedNetwork("");
            return
        }

        setSelectedNetwork(network.id);
    }

    const onAddressChange = (event: any) => {
        setAddress(event.target.value);
        setShowAlert(false);
        setShowImportAlert(false);
        setVerificationSuccessful(false);
        setImportSuccessful(false);
    }

    const onAddToProject = async (event: any) => {
        await onSubmit(event);

        if (!verificationSuccessful) {
            console.log("Verification not successful, skipping project add");
            return;
        }

        setShowImportAlert(false);
        setShowAlert(false);
        setVerificationSuccessful(false);
        setImportSuccessful(false);

        const success = await RemixClient.addToProject(selectedNetwork, address);

        setShowImportAlert(true);
        setImportSuccessful(success);
    }

    const openTab = (url: string) => {
        return (event: any) => {
            event.preventDefault();
            window.open(url);
        };
    }

    return (
        <div className="verify-page">
            <Form onSubmit={onSubmit}>
                <Form.Group>
                    <Form.Label>Network</Form.Label>
                    <Form.Control as="select" onChange={event => onNetworkChange(event.target.value)}
                        value={selectedNetwork}>
                        <option key="" value="">None</option>
                        {networks.map((network) => {
                            return <option key={network.id}
                                value={network.id}>
                                {network.name}
                            </option>
                        })}
                    </Form.Control>
                    <Form.Text className="text-muted">
                        Please select the network where contract is deployed
                    </Form.Text>
                </Form.Group>

                <Form.Group>
                    <Form.Label>Contract</Form.Label>
                    <Form.Control as="select" onChange={event => setSelectedContract(event.target.value)}
                        value={selectedContract}>
                        <option key="" value="">None</option>
                        {compiledContracts.map((contract) => {
                            return <option key={contract}
                                value={contract}>
                                {contract}
                            </option>
                        })}
                    </Form.Control>
                    <Form.Text className="text-muted">
                        Please select the contract you want to verify
                    </Form.Text>
                </Form.Group>

                <Form.Group>
                    <Form.Label>Address</Form.Label>
                    <Form.Control type="text" placeholder="Contract Address (required)"
                        value={address}
                        onChange={onAddressChange} />
                </Form.Group>

                <Form.Group>
                    <Button variant="primary" type="submit"
                        disabled={!selectedContract || !address || !selectedNetwork}>
                        Verify Contract
                    </Button>
                </Form.Group>

                <Form.Group>
                    <Button variant="secondary" className="add-to-project-btn" type="button" onClick={onAddToProject}
                        disabled={!selectedContract || !address || !selectedNetwork}>
                        Verify and Add to Project
                    </Button>
                    <Form.Text className="text-muted">
                        If you use this option, after the contract is verified, it will automatically be added to the project you selected in the settings
                    </Form.Text>
                </Form.Group>
            </Form>

            {showAlert && verificationSuccessful && <Alert variant="success">
                Contract successfully verified! You can see it by <a
                    onClick={openTab(`https://dashboard.tenderly.co/contract/${getNetworkSlug(selectedNetwork)}/${address.toLowerCase()}`)}
                    rel="noopener noreferrer"
                    href={`https://dashboard.tenderly.co/contract/${getNetworkSlug(selectedNetwork)}/${address.toLowerCase()}`}>
                    clicking here
            </a>.
            </Alert>}
            {showAlert && !verificationSuccessful && <Alert variant="danger">
                Failed verifying contract. Please check if the network, address and compiler
                information is correct. After that, please re-compile your contract and try again.
            </Alert>}

            {showImportAlert && importSuccessful && <Alert variant="success">
                Contract successfully added to project! You can see it by <a
                    onClick={openTab(`https://dashboard.tenderly.co/${username}/${projectSlug}/contract/${getNetworkSlug(selectedNetwork)}/${address.toLowerCase()}`)}
                    rel="noopener noreferrer"
                    href={`https://dashboard.tenderly.co/${username}/${projectSlug}/contract/${getNetworkSlug(selectedNetwork)}/${address.toLowerCase()}`}>
                    clicking here
            </a>.
            </Alert>}
        </div>
    );
}
