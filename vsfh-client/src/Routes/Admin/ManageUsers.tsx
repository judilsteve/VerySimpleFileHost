import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button, Card, Checkbox, Container, Form, Header, Icon, Input, Modal, Popup } from "semantic-ui-react";
import { Configuration, UserListingDto, UsersApi } from "../../API";
import { routes } from "../../App";
import CenteredSpinner from "../../Components/CenteredSpinner";
import useEndpointData from "../../Hooks/useEndpointData";

//const api = new UsersApi(new Configuration({ basePath: window.location.origin })); // TODO_JU Shared instances for this?

const fakeUsers: UserListingDto[] = [
    {
        id: '1',
        fullName: 'Duke Nukem',
        loginName: 'duke123',
        isAdministrator: true,
        activated: true
    },
    {
        id: '2',
        fullName: 'Ash Williams',
        loginName: 's_mart_groovy_dude',
        isAdministrator: false,
        activated: false
    },
    {
        id: '3',
        fullName: 'Marco Pagot',
        loginName: 'bigredplane33',
        isAdministrator: false,
        activated: true
    },
    {
        id: '4',
        fullName: 'Miss Pauling',
        loginName: 'purplegirl47',
        isAdministrator: true,
        activated: false
    }
];

class FakeApi
{
    async usersGet() {
        return await new Promise<UserListingDto[]>(res =>
            window.setTimeout(() => res(fakeUsers), 200));
    }
}
const api = new FakeApi();

interface InviteLinkModalProps {
    inviteKey: string;
    userFullName: string;
    open: boolean;
    close: () => void;
}

function InviteLinkModal(props: InviteLinkModalProps) {
    const { inviteKey, userFullName, open, close } = props;

    const inviteLink = `${window.location.origin}/AcceptInvite/${inviteKey}`;

    const [justCopied, setJustCopied] = useState(false);
    const copyLink = () => {
        navigator.clipboard.writeText(inviteLink);
        setJustCopied(true);
    };

    useEffect(() => {
        if(!justCopied) return;
        const timer = window.setTimeout(() => setJustCopied(false), 1000);
        return () => window.clearTimeout(timer);
    }, [justCopied]);

    const copyButton = <Popup
        open={justCopied}
        content="Copied to clipboard"
        trigger={<Button icon="copy" primary onClick={copyLink} />} />

    return <Modal size="small" open={open}>
        <Modal.Header>Invite Link for {userFullName}</Modal.Header>
        <Modal.Content>
            <p>Copy the link below and send it securely to your user</p>
            <p>Once you close this modal, you will not be able to view the link again</p>
            <Input fluid
                value={inviteLink}
                action={copyButton} />
        </Modal.Content>
        <Modal.Actions>
            <Button onClick={close} icon="check" secondary>Done</Button>
        </Modal.Actions>
    </Modal>
}

interface DeleteUserModalProps {
    userLoginName: string;
    userFullName: string;
    open: boolean;
    deleteUser: () => void;
    cancel: () => void;
}

function DeleteUserModal(props: DeleteUserModalProps) {
    const { userLoginName, userFullName, open, deleteUser, cancel } = props;

    return <Modal size="tiny" open={open} onClose={cancel}>
        <Modal.Header>Delete User "{userLoginName}" ({userFullName})</Modal.Header>
        <Modal.Content>
            <p>Are you sure?</p>
        </Modal.Content>
        <Modal.Actions>
            <Button onClick={deleteUser} icon="remove user" negative>Delete</Button>
            <Button onClick={cancel} icon="cross" secondary>Cancel</Button>
        </Modal.Actions>
    </Modal>
}

function ManageUsers() {
    // TODO_JU This route and file browser should have navigation and a logout button

    const navigate = useNavigate();
    const [users, loadingUsers] = useEndpointData(
        useCallback(() => api.usersGet(), []),
        useCallback(e => {
            const response = e as Response;
            if(response.status === 403)
                navigate(routes.unauthorised);
            else navigate(routes.serverError);
        }, [navigate]));

    const [newUserFullName, setNewUserFullName] = useState('');
    const [editUsers, setEditUsers] = useState<{[userId: string]: UserListingDto}>({});

    useEffect(() => {
        setEditUsers(editUsers => {
            // Filter out any users currently being edited that no longer exist
            const newEditUsers: {[userId: string]: UserListingDto} = {};
            for(const user of users ?? []) {
                const editUser = editUsers[user.id!];
                if(editUser)
                    newEditUsers[user.id!] = editUser;
            }
            return newEditUsers;
        });
    }, [users]);

    const setUserFullName = useCallback((userId: string, fullName: string) => {
        setEditUsers(editUsers => {
            const user = editUsers[userId];
            user.fullName = fullName;    
            return { ...editUsers };
        });
    }, []);

    const toggleUserIsAdmin = useCallback((userId: string) => {
        setEditUsers(editUsers => {
            const user = editUsers[userId];
            user.isAdministrator = !user.isAdministrator;
            return { ...editUsers };
        });
    }, []);

    if(loadingUsers) return <CenteredSpinner />;

    // TODO_JU:
    // "Are you sure?" modal for deleting a user
    // Modal with copyable invite link when adding a user or resetting their password
    // Colour scheme for everything here

    return <Container>
        <Header as="h1" style={{ paddingTop: "1rem" }}>Manage Users</Header>
        <Card.Group>
        {
            users!.map(u => <Card key={u.id}>
                <Card.Content>
                    <Card.Header>
                        <Icon.Group>
                            <Icon name="user" />
                            {!u.activated && <Popup trigger={<Icon corner name="lock" />} content={`${u.loginName} is locked out pending password reset`} />}
                        </Icon.Group>{u.loginName}</Card.Header>
                    <Card.Meta>{u.fullName}{u.isAdministrator ? " (Admin)" : ""} <Popup trigger={<Button size="mini" icon="edit" inverted />} content="Edit" /></Card.Meta>{/*TODO_JU Function to enter edit mode*/}
                    {
                        /* TODO_JU Probably split this into its own component */
                        editUsers[u.id!] && <Form>
                            <Form.Input placeholder="Full Name" value={editUsers[u.id!].fullName} onChange={e => setUserFullName(u.id!, e.target.value)} />
                            <Checkbox label="Admin" onChange={() => toggleUserIsAdmin(u.id!)} />
                        </Form>
                       /* TODO_JU Discard and save changes button (with validation)*/
                    }
                </Card.Content>
                <Card.Content extra>
                    <div style={{float: 'right'}}>
                        <Popup trigger={<Button size="small" icon="unlock" />} content="Reset Password" />
                        <Popup trigger={<Button negative size="small" icon="remove user" />} content="Delete User" />
                    </div>
                </Card.Content>
            </Card>)
        }
            <Card>
                <Card.Content>
                    <Card.Header>
                        <Icon name="user" />
                        New User
                    </Card.Header>
                    <Form>
                        <Form.Input placeholder="Full Name" value={newUserFullName} onChange={e => setNewUserFullName(e.target.value)} />
                        <Checkbox label="Admin"/>
                    </Form>
                </Card.Content>
                <Card.Content extra>
                    <div style={{float: 'right'}}>
                        {/* TODO_JU Callback for this (and validation) */}
                        <Popup trigger={<Button positive size="small" icon="add user" />} content="Add User" />
                    </div>
                </Card.Content>
            </Card>
        </Card.Group>
        <InviteLinkModal inviteKey="TODO_JU" userFullName="TODO_JU" open={true} close={() => {}} />
        <DeleteUserModal userLoginName="TODO_JU" userFullName="TODO_JU" open={false} cancel={() => {}} deleteUser={() => {}} />
    </Container>;
}

export default ManageUsers;