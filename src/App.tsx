import React, { useEffect, useState } from 'react';
import './App.scss';
import RemixClient from './RemixClient';
import { Container } from "react-bootstrap";
import { Accordion } from "./components/common/Accordion";
import { AccordionElement } from "./components/common/AccordionElement";
import { Settings } from "./components/pages/Settings/Settings";
import { Verify } from "./components/pages/Verify/Verify";
import { Account, Project } from "./types/Api";
import Cookie from "js-cookie";
import { AddFromProject } from "./components/pages/AddFromProject/AddFromProject";
import { Alert } from "react-bootstrap";
import { isLocalStorageAvailable } from "./util";

const App: React.FC = () => {
    const [accessToken, setAccessToken] = useState("");
    const [accessTokenSet, setAccessTokenSet] = useState(false);
    const [showAccessTokenAlert, setShowAccessTokenAlert] = useState(false);
    const [validToken, setValidToken] = useState(false);

    const [projects, setProjects] = useState([] as Project[]);
    const [contracts, setContracts] = useState({} as { [key: string]: Account });
    const [selectedProject, setSelectedProject] = useState("");
    const [compiledContracts, setCompiledContracts] = useState([] as string[]);
    const [projectSlug, setProjectSlug] = useState("");
    const [username, setUsername] = useState("");
    const [localStorageAvailable, setLocalStorageAvailable] = useState(true);
    const [hasPrivateContracts, setHasPrivateContracts] = useState(false);

    const [projectMap, setProjectMap] = useState({} as { [key: string]: Project });

    const handleSetAccessToken = async (accessToken: string, initialSetup?: boolean) => {
        setShowAccessTokenAlert(false);
        setAccessTokenSet(false);
        setValidToken(false);
        setHasPrivateContracts(false);

        Cookie.set("remix_tenderly_access_token", accessToken, { sameSite: "None", secure: true });
        RemixClient.setAccessToken(accessToken);

        const { projects, projectMap } = await getProjects();

        const success = await RemixClient.checkToken();

        setShowAccessTokenAlert(!initialSetup);
        setValidToken(success);

        if (!success) {
            return;
        }

        setAccessToken(accessToken);
        setAccessTokenSet(true);

        let selectedProjectId = localStorage.getItem("remix_tenderly_selected_project") || "";

        if (!selectedProjectId && projects.length > 0) {
            selectedProjectId = projects[0].id;
        }

        onProjectChange(selectedProjectId, projectMap);
    }

    useEffect(() => {
        const load = async () => {
            const testLS = isLocalStorageAvailable();

            setLocalStorageAvailable(testLS);

            if (!testLS) {
                return;
            }

            await RemixClient.onload();

            RemixClient.client.on('solidity', 'compilationFinished', (fileName: string, source: any, languageVersion: string, data: any) => {
                const compiledContractsMap: { [key: string]: boolean } = {};
                const compiledContractsList: string[] = [];

                Object.keys(data.contracts).forEach(key => {
                    Object.keys(data.contracts[key]).forEach(nestedKey => {
                        compiledContractsMap[nestedKey] = true;
                    });
                });

                Object.entries(compiledContractsMap).forEach(([contractName, exists]) => {
                    compiledContractsList.push(contractName);
                });

                compiledContractsList.sort();

                setCompiledContracts(compiledContractsList);
            });

            let existingAccessToken = Cookie.get("remix_tenderly_access_token");
            if (!existingAccessToken) {
                existingAccessToken = "";
            }

            if (existingAccessToken) {
                await handleSetAccessToken(existingAccessToken, true);
            }
        }

        load();
    }, []);

    const getProjects = async (): Promise<{ projects: Project[], projectMap: { [key: string]: Project } }> => {
        const projects = await RemixClient.getProjects();

        const newProjectMap: { [key: string]: Project } = {};

        projects.forEach(project => newProjectMap[project.id] = project)

        setProjects(projects);
        setProjectMap(newProjectMap);

        return { projects, projectMap: newProjectMap };
    }

    const onAccessTokenChange = (event: any) => {
        setAccessToken(event.target.value);
    }

    const onProjectChange = async (projectId: string, projectMap: { [id: string]: Project }) => {
        const project = projectMap[projectId];

        localStorage.setItem("remix_tenderly_selected_project", projectId);

        if (!project) {
            setSelectedProject("");
            setProjectSlug("");
            RemixClient.setProject("", "");
            return
        }

        setSelectedProject(project.id);
        RemixClient.setProject(project.slug, project.owner.username);
        setProjectSlug(project.slug);
        setUsername(project.owner.username);

        await refreshContracts();

        await refreshBilling();
    }

    const refreshContracts = async () => {
        const contracts = await RemixClient.getContracts();

        const contractsMap: { [key: string]: Account } = {};

        for (const contract of contracts) {
            contractsMap[contract.id] = contract;
        }

        setContracts(contractsMap);
    }

    const refreshBilling = async () => {
        const billingInfo = await RemixClient.getBillingInfo();
        if (!billingInfo) {
            setHasPrivateContracts(false);
            return;
        }

        setHasPrivateContracts(billingInfo.project.includes.private_contracts);
    };

    return (
        <div id="wrapper">
            <Container>
                <main role="main">
                    {localStorageAvailable && <Accordion>
                        <AccordionElement headerText="Settings" eventKey="0">
                            <Settings handleSetAccessToken={handleSetAccessToken}
                                accessToken={accessToken}
                                accessTokenSet={accessTokenSet}
                                showAlert={showAccessTokenAlert}
                                validToken={validToken}
                                onAccessTokenChange={onAccessTokenChange}
                                getProjects={getProjects}
                                projects={projects}
                                selectedProject={selectedProject}
                                onProjectChange={onProjectChange}
                                projectMap={projectMap} />
                        </AccordionElement>
                        <AccordionElement headerText="Verify" eventKey="1"
                            disabled={!accessTokenSet || !selectedProject}>
                            <Verify compiledContracts={compiledContracts} projectSlug={projectSlug}
                                username={username} hasPrivateContracts={hasPrivateContracts} />
                        </AccordionElement>
                        <AccordionElement headerText="Import contracts into Remix from Tenderly" eventKey="2"
                            disabled={!accessTokenSet || !selectedProject}>
                            <AddFromProject contracts={contracts} refreshContracts={refreshContracts} />
                        </AccordionElement>
                    </Accordion>}
                    {!localStorageAvailable && <Alert variant="danger">
                        Failed verifying contract. Please check if the network, address and compiler
                        information is correct. After that, please re-compile your contract and try again.
                    </Alert>}
                </main>
            </Container>
        </div>
    );
}

export default App;
