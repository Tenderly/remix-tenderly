import React, {useState} from "react";
import {Account} from "../../../types/Api";
import {Button, Form} from "react-bootstrap";
import "./AddFromProject.scss";
import RemixClient from '../../../RemixClient';
import upath from 'upath';

type Props = {
    contracts: { [id: string]: Account };
}

export const AddFromProject: React.FC<Props> = ({contracts}) => {
    const [selectedContract, setSelectedContract] = useState("");

    const onSubmit = async (event: any) => {
        event.preventDefault();

        const contract = contracts[selectedContract];

        if (!contract) {
            return;
        }

        const contractData = await RemixClient.getContract(contract.contract.network_id, contract.contract.address);
        if (!contractData) {
            return;
        }

        for (const contractInfo of contractData.contract.data.contract_info) {
            await RemixClient.importContract(upath.toUnix(contractInfo.path), contractInfo.source);
        }
    }

    return (
        <div className="add-from-project-page">
            <Form onSubmit={onSubmit}>
                <Form.Group>
                    <Form.Label>Contract</Form.Label>
                    <Form.Control as="select" onChange={event => setSelectedContract(event.target.value)}
                                  value={selectedContract}>
                        <option key="" value="">None</option>
                        {Object.entries(contracts).map(([id, contract]) => {
                            return <option key={id}
                                           value={id}>
                                {!!contract.display_name ? contract.display_name : contract.contract.contract_name}
                            </option>
                        })}
                    </Form.Control>
                    <Form.Text className="text-muted">
                        Please select the contract you want to import into Remix
                    </Form.Text>
                </Form.Group>

                <Form.Group>
                    <Button variant="primary" type="submit" disabled={!selectedContract}>
                        Import
                    </Button>
                </Form.Group>
            </Form>
        </div>
    );
}
