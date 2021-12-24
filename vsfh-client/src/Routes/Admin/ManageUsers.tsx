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
        <Modal.Header>Invite link for {userFullName}</Modal.Header>
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
        <Modal.Header>Delete user '{userLoginName}' ({userFullName})?</Modal.Header>
        <Modal.Content>
            <p>This action is permanent</p>
        </Modal.Content>
        <Modal.Actions>
            <Button onClick={deleteUser} icon="remove user" negative>Delete</Button>
            <Button onClick={cancel} icon="cross" secondary>Cancel</Button>
        </Modal.Actions>
    </Modal>
}

interface UserEditModel {
    fullName: string;
    isAdministrator: boolean;
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
    const [editUsers, setEditUsers] = useState<{[userId: string]: UserEditModel}>({});

    useEffect(() => {
        setEditUsers(editUsers => {
            // Filter out any users currently being edited that no longer exist
            const newEditUsers: {[userId: string]: UserEditModel} = {};
            for(const user of users ?? []) {
                const editUser = editUsers[user.id!];
                if(editUser)
                    newEditUsers[user.id!] = editUser;
            }
            return newEditUsers;
        });
    }, [users]);

    const editUser = useCallback((user: UserListingDto) => {
        setEditUsers(editUsers => {
            const newEditUser = {
                fullName: user.fullName!,
                isAdministrator: user.isAdministrator!
            };
            return { ...editUsers, [user.id!]: newEditUser };
        })
    }, []);

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
                        {u.activated
                            ? <Icon name="user" />
                            : <Popup trigger={<Icon name="lock" />} content={`'${u.loginName}' is locked out pending password reset`} />
                        }
                        {u.loginName}
                    </Card.Header>
                    <Card.Meta>{u.fullName}{u.isAdministrator ? " (Admin)" : ""}</Card.Meta>{/*TODO_JU Function to enter edit mode*/}
                    {
                        /* TODO_JU Probably split this into its own component to make state a bit cleaner */
                        editUsers[u.id!] && <>
                            <Form style={{ paddingTop: '1.5rem' }}>
                                <Form.Field>
                                    <Form.Input placeholder="Full Name" value={editUsers[u.id!].fullName} onChange={e => setUserFullName(u.id!, e.target.value)} />
                                </Form.Field>
                                <Form.Field>
                                    <Checkbox label="Admin" onChange={() => toggleUserIsAdmin(u.id!)} />
                                </Form.Field>
                            </Form>
                        </>
                    }
                </Card.Content>
                <Card.Content extra>
                    <div style={{float: 'right'}}>
                        {
                            editUsers[u.id!] ? <>
                                <Popup trigger={<Button size="small" icon="close" secondary />} content="Discard" />
                                <Popup trigger={<Button size="small" icon="check" positive disabled={!editUsers[u.id!].fullName} />} content="Save" />
                            </> : <>
                                <Popup trigger={<Button size="small" icon="write" primary onClick={() => editUser(u)} />} content="Edit" />
                            </>
                        }
                        <Popup trigger={<Button size="small" icon="unlock" color="teal" />} content="Reset Password" />
                        <Popup trigger={<Button size="small" icon="remove user" color="orange" />} content="Delete" />
                    </div>
                </Card.Content>
            </Card>)
        }
            <Card>
                <Card.Content>
                    <Card.Header>
                        <Icon name="add user" />
                        New User
                    </Card.Header>
                    <Form style={{ paddingTop: '1.5rem' }}>
                        <Form.Input placeholder="Full Name" value={newUserFullName} onChange={e => setNewUserFullName(e.target.value)} />
                        <Checkbox label="Admin"/>
                    </Form>
                </Card.Content>
                <Card.Content extra>
                    <div style={{float: 'right'}}>
                        {/* TODO_JU Callback for this */}
                        <Popup trigger={<Button disabled={!newUserFullName} positive size="small" icon="check" />} content="Add" />
                    </div>
                </Card.Content>
            </Card>
        </Card.Group>
        <InviteLinkModal inviteKey="TODO_JU" userFullName="TODO_JU" open={false} close={() => {}} />
        <DeleteUserModal userLoginName="TODO_JU" userFullName="TODO_JU" open={false} cancel={() => {}} deleteUser={() => {}} />
    </Container>;
}

export default ManageUsers;