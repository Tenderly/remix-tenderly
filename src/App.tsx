import React, {useEffect, useState} from 'react';
import './App.scss';
import RemixClient from './RemixClient';
import {Container} from "react-bootstrap";
import {Accordion} from "./components/common/Accordion";
import {AccordionElement} from "./components/common/AccordionElement";
import {Settings} from "./components/pages/Settings/Settings";
import {Verify} from "./components/pages/Verify/Verify";
import {Account, Project} from "./types/Api";
import Cookie from "js-cookie";
import {AddFromProject} from "./components/pages/AddFromProject/AddFromProject";

const App: React.FC = () => {
    const [accessToken, setAccessToken] = useState("");
    const [projects, setProjects] = useState([] as Project[]);
    const [contracts, setContracts] = useState({} as { [key: string]: Account });
    const [selectedProject, setSelectedProject] = useState("");
    const [accessTokenSet, setAccessTokenSet] = useState(false);

    const [projectMap, setProjectMap] = useState({} as { [key: string]: Project });

    useEffect(() => {
        const load = async () => {
            await RemixClient.onload();

            let existingAccessToken = Cookie.get("remix_tenderly_access_token");
            if (!existingAccessToken) {
                existingAccessToken = "";
            }

            if (existingAccessToken) {
                await handleSetAccessToken(existingAccessToken);
            }
        }

        load();
    }, []);

    const handleSetAccessToken = async (accessToken: string) => {
        Cookie.set("remix_tenderly_access_token", accessToken, {sameSite: "None", secure: true});
        RemixClient.setAccessToken(accessToken);
        setAccessToken(accessToken);
        setAccessTokenSet(true);
        await getProjects();

        const selectedProjectId = localStorage.getItem("remix_tenderly_selected_project") || "";
        onProjectChange(selectedProjectId);
    }

    const getProjects = async () => {
        const projects = await RemixClient.getProjects();

        const newProjectMap: { [key: string]: Project } = {};

        projects.forEach(project => newProjectMap[project.id] = project)

        setProjects(projects);
        setProjectMap(newProjectMap);
    }

    const onAccessTokenChange = (event: any) => {
        setAccessToken(event.target.value);
    }

    const onProjectChange = async (projectId: string) => {
        const project = projectMap[projectId];

        localStorage.setItem("remix_tenderly_selected_project", projectId);

        if (!project) {
            setSelectedProject("");
            RemixClient.setProject("", "");
            return
        }

        setSelectedProject(project.id);
        RemixClient.setProject(project.slug, project.owner.username);

        const contracts = await RemixClient.getContracts();

        const contractsMap: { [key: string]: Account } = {};

        for (const contract of contracts) {
            contractsMap[contract.id] = contract;
        }

        setContracts(contractsMap);
    }

    return (
        <div id="wrapper">
            <Container>
                <main role="main">
                    <Accordion>
                        <AccordionElement headerText="Settings" eventKey="0">
                            <Settings handleSetAccessToken={handleSetAccessToken}
                                      accessToken={accessToken}
                                      accessTokenSet={accessTokenSet}
                                      onAccessTokenChange={onAccessTokenChange}
                                      getProjects={getProjects}
                                      projects={projects}
                                      selectedProject={selectedProject}
                                      onProjectChange={onProjectChange}/>
                        </AccordionElement>
                        <AccordionElement headerText="Verify" eventKey="1"
                                          disabled={!accessTokenSet || !selectedProject}>
                            <Verify/>
                        </AccordionElement>
                        <AccordionElement headerText="Add From Project" eventKey="2"
                                          disabled={!accessTokenSet || !selectedProject}>
                            <AddFromProject contracts={contracts}/>
                        </AccordionElement>
                    </Accordion>
                </main>
            </Container>
        </div>
    );
}

export default App;
