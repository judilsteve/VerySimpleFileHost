import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Button, Card, Checkbox, Container, Form, Grid, Header, Icon, Input, Modal, Popup } from "semantic-ui-react";
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
        <Modal.Header>Delete user {userLoginName} ({userFullName})?</Modal.Header>
        <Modal.Content>
            <p>This action is permanent</p>
        </Modal.Content>
        <Modal.Actions>
            <Button onClick={deleteUser} icon="remove user" negative>Delete</Button>
            <Button onClick={cancel} icon="cross" secondary>Cancel</Button>
        </Modal.Actions>
    </Modal>
}

interface UserEditProps {
    userDto: UserListingDto;
    setConfirmDeleteUser: () => void;
}

function UserCard(props: UserEditProps) {
    const {
        userDto: { fullName, activated, loginName, isAdministrator },
        setConfirmDeleteUser
    } = props;

    const [editMode, setEditMode] = useState(false);
    const startEditing = useCallback(() => {
        setNewFullName(fullName!);
        setNewIsAdministrator(isAdministrator!);
        setEditMode(true);
    }, [fullName, isAdministrator]);

    const [newFullName, setNewFullName] = useState('');
    useEffect(() => {
        setNewFullName(fullName!);
    }, [fullName]);

    const [newIsAdministrator, setNewIsAdministrator] = useState(false);
    useEffect(() => {
        setNewIsAdministrator(isAdministrator!);
    }, [isAdministrator]);

    return <Card>
        <Card.Content>
            <Card.Header>
                {activated
                    ? <Icon name="user" />
                    : <Popup trigger={<Icon name="lock" />} content={`'${loginName}' is locked out pending password reset`} />
                }
                {loginName}
            </Card.Header>
            <Card.Meta>{fullName}{isAdministrator ? " (Admin)" : ""}</Card.Meta>
            {
                editMode && <>
                    <Form style={{ paddingTop: '1.5rem' }}>
                        <Form.Field>
                            <Form.Input placeholder="Full Name" value={newFullName} onChange={e => setNewFullName(e.target.value)} />
                        </Form.Field>
                        <Form.Field>
                            <Checkbox label="Admin" checked={newIsAdministrator} onChange={() => setNewIsAdministrator(!newIsAdministrator)} />
                        </Form.Field>
                    </Form>
                </>
            }
        </Card.Content>
        <Card.Content extra>
            <div style={{float: 'right'}}>
                {
                    editMode ? <>
                        <Popup trigger={<Button size="small" icon="close" secondary onClick={() => setEditMode(false)} />} content="Discard" />
                        <Popup trigger={<Button size="small" icon="check" positive disabled={!newFullName} />} onClick={() => console.debug("TODO_JU")} content="Save" />
                    </> : <>
                        <Popup trigger={<Button size="small" icon="write" primary onClick={startEditing} />} content="Edit" />
                    </>
                }
                <Popup trigger={<Button size="small" icon="unlock" color="teal" />} onClick={() => console.debug("TODO_JU")} content="Reset Password" />
                <Popup trigger={<Button size="small" icon="remove user" color="orange" onClick={setConfirmDeleteUser} />} content="Delete" />
            </div>
        </Card.Content>
    </Card>;
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

    const [confirmDeleteUser, setConfirmDeleteUser] = useState<UserListingDto | null>(null);

    const [textFilter, setTextFilter] = useState('');
    const [activeStatusFilter, setActiveStatusFilter] = useState<boolean | null>(null);
    const [adminFilter, setAdminFilter] = useState<boolean | null>(null);

    const filteredUsers = useMemo(() => {
        if(loadingUsers) return [];

        let predicates: ((u: UserListingDto) => boolean)[] = [];
        if(!!textFilter) {
            predicates.push(u =>
                u.fullName!.toLocaleLowerCase().includes(textFilter)
                || u.loginName!.toLocaleLowerCase().includes(textFilter));
        }
        if(activeStatusFilter !== null) {
            predicates.push(u => u.activated === activeStatusFilter);
        }
        if(adminFilter !== null) {
            predicates.push(u => u.isAdministrator === adminFilter);
        }

        if(!predicates.length) return users!;
        return users!.filter(u => predicates.every(p => p(u)));
    }, [users, loadingUsers, textFilter, activeStatusFilter, adminFilter]);

    if(loadingUsers) return <CenteredSpinner />;

    return <Container>
        <Header as="h1" style={{ paddingTop: "1rem" }}>Manage Users</Header>
        <Grid stackable columns={3}>
            <Grid.Column>
                <Input fluid icon="filter" iconPosition="left" placeholder="Filter"
                    value={textFilter} onChange={e => setTextFilter(e.target.value.toLocaleLowerCase())} />
            </Grid.Column>
            <Grid.Column>
                <Button.Group fluid>
                    <Button active={activeStatusFilter === true} onClick={() => setActiveStatusFilter(true)}>Active</Button>
                    <Button active={activeStatusFilter === false} onClick={() => setActiveStatusFilter(false)}>Locked</Button>
                    <Button active={activeStatusFilter === null} onClick={() => setActiveStatusFilter(null)}>All</Button>
                </Button.Group>
            </Grid.Column>
            <Grid.Column>
                <Button.Group fluid>
                    <Button active={adminFilter === true} onClick={() => setAdminFilter(true)}>Admins</Button>
                    <Button active={adminFilter === false} onClick={() => setAdminFilter(false)}>Users</Button>
                    <Button active={adminFilter === null} onClick={() => setAdminFilter(null)}>All</Button>
                </Button.Group>
            </Grid.Column>
        </Grid>
        <Card.Group doubling stackable itemsPerRow={4} style={{ marginTop: "1rem" }}>
        {
            filteredUsers!.map(u =>
                <UserCard key={u.id!} userDto={u} setConfirmDeleteUser={() => setConfirmDeleteUser(u)} />)
        }
            <Card>
                <Card.Content>
                    <Card.Header>
                        <Icon name="add user" />
                        New User
                    </Card.Header>
                    <Form style={{ paddingTop: '1.5rem' }}>
                        <Form.Field>
                            <Form.Input placeholder="Full Name" value={newUserFullName} onChange={e => setNewUserFullName(e.target.value)} />
                        </Form.Field>
                        <Form.Field>
                            <Checkbox label="Admin"/>
                        </Form.Field>
                    </Form>
                </Card.Content>
                <Card.Content extra>
                    <div style={{float: 'right'}}>
                        <Popup trigger={<Button onclick={() => console.debug("TODO_JU")} disabled={!newUserFullName} positive size="small" icon="check" />} content="Add" />
                    </div>
                </Card.Content>
            </Card>
        </Card.Group>
        <InviteLinkModal inviteKey="TODO_JU" userFullName="TODO_JU" open={false} close={() => {}} />
        <DeleteUserModal
            userLoginName={confirmDeleteUser?.loginName!}
            userFullName={confirmDeleteUser?.fullName!}
            open={!!confirmDeleteUser}
            cancel={() => setConfirmDeleteUser(null)}
            deleteUser={() => {}} />
    </Container>;
}

export default ManageUsers;