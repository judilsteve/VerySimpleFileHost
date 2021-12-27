import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Button, Card, Checkbox, Container, Form, Grid, Header, Icon, Input, Modal, Popup } from "semantic-ui-react";
import { Configuration, UserListingDto, UsersApi } from "../../API";
import { routes } from "../../App";
import CenteredSpinner from "../../Components/CenteredSpinner";
import useEndpointData from "../../Hooks/useEndpointData";
import { LoginRouteParameters } from "../Login";

const api = new UsersApi(new Configuration({ basePath: window.location.origin })); // TODO_JU Shared instances for this?

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
            <p>Copy the link below and send it securely to the user</p>
            <p>Once you close this modal, you will not be able to view the link again</p>
            <Input fluid
                value={inviteLink}
                action={copyButton} />
        </Modal.Content>
        <Modal.Actions>
            <Button onClick={close} secondary><Icon name="check" />Done</Button>
        </Modal.Actions>
    </Modal>
}

interface ConfirmResetPasswordModalProps {
    userDto: UserListingDto | null;
    open: boolean;
    afterResetPassword: (inviteKey: string) => void;
    cancel: () => void;
}

function ConfirmResetPasswordModal(props: ConfirmResetPasswordModalProps) {
    const { userDto, open, afterResetPassword, cancel } = props;

    const [loading, setLoading] = useState(false);
    const resetPassword = () => {
        let cancel = false;
        setLoading(true);
        (async () => {
            let response;
            try {
                response = await api.usersUserIdPut({
                    userId: userDto?.id!,
                    userEditDto: {
                        fullName: null,
                        isAdministrator: null,
                        resetPassword: true
                    }
                });
            } catch(e) {
                // TODO_JU handle errors
            }
            if(cancel) return;
            if(response) afterResetPassword(response.inviteKey!);
        })();
    }

    return <Modal size="tiny" open={open} onClose={cancel}>
        <Modal.Header>Reset password for {userDto?.loginName ?? '<unnamed>'} ({userDto?.fullName})?</Modal.Header>
        <Modal.Content>
            <p>This will disable their account until they open the new invite link.</p>
        </Modal.Content>
        <Modal.Actions>
            <Button onClick={resetPassword} color="teal" loading={loading ? true : undefined}><Icon name="unlock" />Reset</Button>
            <Button onClick={cancel} secondary><Icon name="close" />Cancel</Button>
        </Modal.Actions>
    </Modal>
}

interface DeleteUserModalProps {
    userDto: UserListingDto | null;
    open: boolean;
    afterDeleteUser: () => void;
    cancel: () => void;
}

function DeleteUserModal(props: DeleteUserModalProps) {
    const { userDto, open, afterDeleteUser, cancel } = props;

    const [loading, setLoading] = useState(false);
    const deleteUser = () => {
        let cancel = false;
        setLoading(true);
        (async () => {
            try {
                await api.usersUserIdDelete({ userId: userDto?.id! });
            } catch(e) {
                // TODO_JU handle errors
            }
            if(cancel) return;
            afterDeleteUser();
        })();
    }

    return <Modal size="tiny" open={open} onClose={cancel}>
        <Modal.Header>Delete user {userDto?.loginName ?? '<unnamed>'} ({userDto?.fullName})?</Modal.Header>
        <Modal.Content>
            <p>This action is permanent</p>
        </Modal.Content>
        <Modal.Actions>
            <Button onClick={deleteUser} negative loading={loading ? true : undefined}><Icon name="remove user" />Delete</Button>
            <Button onClick={cancel} secondary><Icon name="close" />Cancel</Button>
        </Modal.Actions>
    </Modal>
}

interface UserEditProps {
    userDto: UserListingDto;
    setConfirmDeleteUser: () => void;
    reloadList: () => void;
    resetPassword: () => void;
}

function UserCard(props: UserEditProps) {
    const {
        userDto: { id, fullName, activated, loginName, isAdministrator },
        setConfirmDeleteUser,
        reloadList,
        resetPassword
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

    const [loading, setLoading] = useState(false);

    const save = useCallback(() => {
        let cancel = false;
        setLoading(true);
        (async () => {
            try {
                await api.usersUserIdPut({
                    userId: id!,
                    userEditDto: {
                        fullName: newFullName,
                        isAdministrator: newIsAdministrator,
                        resetPassword: false
                    }
                });
            } catch(e) {
                // TODO_JU Handle errors
            }
            if(cancel) return;
            reloadList();
            setLoading(false);
        })();
        return () => { cancel = true; };
    }, [newFullName, newIsAdministrator, id, reloadList]);

    return <Card>
        <Card.Content>
            <Card.Header>
                {activated
                    ? <Icon name="user" />
                    : <Popup trigger={<Icon name="lock" />} content={`'${loginName ?? '<unnamed>'}' is locked out pending password reset`} />
                }
                {loginName}
            </Card.Header>
            <Card.Meta>{fullName}{isAdministrator ? " (Admin)" : ""}</Card.Meta>
            {
                editMode && <>
                    <Form style={{ paddingTop: '1.5rem' }}>
                        <Form.Field>
                            <Form.Input placeholder="Full Name" disabled={loading} value={newFullName} onChange={e => setNewFullName(e.target.value)} />
                        </Form.Field>
                        <Form.Field>
                            <Checkbox label="Admin" disabled={loading} checked={newIsAdministrator} onChange={() => setNewIsAdministrator(!newIsAdministrator)} />
                        </Form.Field>
                    </Form>
                </>
            }
        </Card.Content>
        <Card.Content extra>
            <div style={{float: 'right'}}>
                {
                    editMode ? <>
                        <Popup trigger={<Button size="small" icon="check" positive disabled={!newFullName} onClick={save} loading={loading ? true : undefined} />} content="Save" />
                        <Popup trigger={<Button size="small" icon="close" secondary onClick={() => setEditMode(false)} />} content="Discard" />
                    </> : <>
                        <Popup trigger={<Button size="small" icon="write" primary onClick={startEditing} />} content="Edit" />
                    </>
                }
                <Popup trigger={<Button size="small" icon="unlock" onClick={resetPassword} color="teal" />} content="Reset Password" />
                <Popup trigger={<Button size="small" icon="remove user" onClick={setConfirmDeleteUser} color="orange" />} content="Delete" />
            </div>
        </Card.Content>
    </Card>;
}

interface NewUserCardProps {
    afterAddUser: () => void;
}

function NewUserCard(props: NewUserCardProps) {
    const { afterAddUser } = props;

    const [newUserFullName, setNewUserFullName] = useState('');
    const [newUserIsAdmin, setNewUserIsAdmin] = useState(false);

    const [loading, setLoading] = useState(false);
    const add = useCallback(() => {
        let cancel = false;
        setLoading(true);
        (async () => {
            try {
                await api.usersPost({
                    userAddRequestDto: {
                        fullName: newUserFullName,
                        isAdministrator: newUserIsAdmin
                    }
                });
            } catch(e) {
                // TODO_JU Handle errors
            }
            if(cancel) return;
            afterAddUser();
            setLoading(false);
        })();
        return () => { cancel = true; };
    }, [newUserFullName, newUserIsAdmin, afterAddUser]);

    return <Card>
        <Card.Content>
            <Card.Header>
                <Icon name="add user" />
                New User
            </Card.Header>
            <Form style={{ paddingTop: '1.5rem' }}>
                <Form.Field>
                    <Form.Input disabled={loading} placeholder="Full Name" value={newUserFullName} onChange={e => setNewUserFullName(e.target.value)} />
                </Form.Field>
                <Form.Field>
                    <Checkbox disabled={loading} label="Admin" checked={newUserIsAdmin} onChange={e => setNewUserIsAdmin(!newUserIsAdmin)}/>
                </Form.Field>
            </Form>
        </Card.Content>
        <Card.Content extra>
            <div style={{float: 'right'}}>
                <Popup trigger={<Button onClick={add} disabled={!newUserFullName} loading={loading} positive size="small" icon="check" />} content="Add" />
            </div>
        </Card.Content>
    </Card>;
}

function ManageUsers() {
    // TODO_JU This route and file browser should have navigation and a logout button

    const navigate = useNavigate();
    const [users, loadingUsers, reloadUsers] = useEndpointData(
        useCallback(() => api.usersGet(), []),
        useCallback(e => {
            const response = e as Response;
            if(response.status === 403)
                navigate(routes.unauthorised);
            else if(response.status === 401)
                navigate(`${routes.login}?${LoginRouteParameters.then}=${encodeURIComponent(routes.manageUsers)}`);
            else navigate(routes.serverError);
        }, [navigate]));

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
                || (u.loginName?.toLocaleLowerCase().includes(textFilter) ?? false));
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

    const [resetPasswordUser, setResetPasswordUser] = useState<UserListingDto | null>(null);
    const [inviteKey, setInviteKey] = useState('');

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
            filteredUsers!.map(u => <UserCard
                key={u.id!}
                userDto={u}
                setConfirmDeleteUser={() => setConfirmDeleteUser(u)}
                reloadList={reloadUsers}
                resetPassword={() => setResetPasswordUser(u)}
                />)
        }
            <NewUserCard afterAddUser={reloadUsers}/>
        </Card.Group>
        <ConfirmResetPasswordModal
            userDto={resetPasswordUser}
            open={!!resetPasswordUser && !inviteKey}
            afterResetPassword={invKey => { setInviteKey(invKey); reloadUsers(); }}
            cancel={() => setResetPasswordUser(null)} />
        <InviteLinkModal
            inviteKey={inviteKey}
            userFullName={resetPasswordUser?.fullName ?? ''}
            open={!!inviteKey}
            close={() => { setResetPasswordUser(null); setInviteKey(''); }} />
        <DeleteUserModal
            open={!!confirmDeleteUser}
            userDto={confirmDeleteUser}
            cancel={() => setConfirmDeleteUser(null)}
            afterDeleteUser={() => { setConfirmDeleteUser(null); reloadUsers(); }} />
    </Container>;
}

export default ManageUsers;