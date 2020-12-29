import React, {useEffect, useState} from "react";
import {Network} from "../../../types/Api";
import RemixClient from "../../../RemixClient";
import {Button, Form} from "react-bootstrap";
import "./Verify.scss";

type Props = {
    compiledContracts: string[];
}

export const Verify: React.FC<Props> = ({compiledContracts}) => {
    const [networks, setNetworks] = useState([] as Network[]);
    const [address, setAddress] = useState("");
    const [networksMap, setNetworksMap] = useState({} as { [key: string]: Network })
    const [selectedNetwork, setSelectedNetwork] = useState("");
    const [verificationSuccessful, setVerificationSuccessful] = useState(false);
    const [selectedContract, setSelectedContract] = useState("");

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

        if (!selectedContract) {
            return;
        }

        const compilationResult = await RemixClient.fetchLastCompilation(selectedContract);
        if (!compilationResult || compilationResult.contracts.length === 0) {
            return;
        }

        compilationResult.contracts[0].networks[selectedNetwork] = {
            address: address,
            links: {},
        }

        const success = await RemixClient.verify(compilationResult);

        setVerificationSuccessful(success);
    }

    const onNetworkChange = (networkId: string) => {
        const network = networksMap[networkId];

        setVerificationSuccessful(false);

        if (!network) {
            setSelectedNetwork("");
            return
        }

        setSelectedNetwork(network.id);
    }

    const onAddressChange = (event: any) => {
        setAddress(event.target.value);
        setVerificationSuccessful(false);
    }

    const onAddToProject = async (event: any) => {
        event.preventDefault();

        const success = await RemixClient.addToProject(selectedNetwork, address);
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
                                  onChange={onAddressChange}/>
                </Form.Group>

                <Form.Group>
                    <Button variant="primary" type="submit" disabled={!selectedContract}>
                        Verify
                    </Button>
                    <Button variant="secondary" className="add-to-project-btn" type="button" onClick={onAddToProject}
                            disabled={!verificationSuccessful}>
                        Add to Project
                    </Button>
                </Form.Group>
            </Form>
        </div>
    );
}
