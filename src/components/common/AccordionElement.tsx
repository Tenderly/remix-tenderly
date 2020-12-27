import React from 'react';
import { Card, Accordion } from "react-bootstrap";
import {ChevronDown} from "react-bootstrap-icons";


export type AccordionElementProps = {
    headerText: string,
    eventKey: string,
    disabled?: boolean;
}

export type Props = React.PropsWithChildren<AccordionElementProps>;

export const AccordionElement: React.FC<Props> = ({ headerText, eventKey, disabled, children }) => (
    <Card>
        {disabled ?
            <Card.Header className="text-secondary default-cursor">
                {headerText}
            </Card.Header> :
            <>
                <Accordion.Toggle className="d-flex justify-content-between" as={Card.Header} eventKey={eventKey}>
                    <span>{headerText}</span>
                    <ChevronDown/>
                </Accordion.Toggle>
                <Accordion.Collapse eventKey={eventKey}>
                    <Card.Body>
                        {children}
                    </Card.Body>
                </Accordion.Collapse>
            </>
        }
    </Card>
)
