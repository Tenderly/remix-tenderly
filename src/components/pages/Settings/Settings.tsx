import React from "react";
import {Button, Form} from 'react-bootstrap';
import "./Settings.scss";
import {Project} from '../../../types/Api';

type Props = {
    handleSetAccessToken: any;

    accessToken: string;
    accessTokenSet: boolean;
    onAccessTokenChange: any;

    getProjects: any;
    onProjectChange: any;
    selectedProject: any;
    projects: Project[];
};

export const Settings: React.FC<Props> = ({handleSetAccessToken, accessTokenSet, selectedProject, projects, accessToken, getProjects, onAccessTokenChange, onProjectChange}) => {
    const onSubmit = async (event: any) => {
        event.preventDefault();

        await handleSetAccessToken(accessToken);
    }


    return (
        <div className="settings-page">
            <Form onSubmit={onSubmit}>
                <Form.Group>
                    <Form.Label>Access Token</Form.Label>
                    <Form.Control type="text" placeholder="Enter Access Token"
                                  value={accessToken}
                                  onChange={onAccessTokenChange}/>
                    <Form.Text className="text-muted">
                        You can generate an access token by going to <a
                        href="https://dashboard.tenderly.co/account/authorization" target="_blank"
                        rel="noreferrer">settings</a> in your
                        Tenderly dashboard.
                    </Form.Text>
                </Form.Group>

                <Form.Group>
                    <Button variant="primary" type="submit">
                        Save
                    </Button>
                    <Button variant="secondary" className="refresh-projects-btn" type="button" onClick={getProjects}
                            disabled={!accessTokenSet}>
                        Refresh projects
                    </Button>
                </Form.Group>

                <Form.Group>
                    <Form.Label>Project</Form.Label>
                    <Form.Control as="select" onChange={event => onProjectChange(event.target.value)}
                                  value={selectedProject}>
                        <option key="" value="">None</option>
                        {projects.map((project) => {
                            return <option key={project.id}
                                           value={project.id}>
                                {project.name} ({project.owner.username}/{project.slug})
                            </option>
                        })}
                    </Form.Control>
                    <Form.Text className="text-muted">
                        You can create a new project by clicking <a
                        href="https://dashboard.tenderly.co/projects/create" target="_blank"
                        rel="noreferrer">here</a>.
                    </Form.Text>
                </Form.Group>
            </Form>
        </div>
    );
};
