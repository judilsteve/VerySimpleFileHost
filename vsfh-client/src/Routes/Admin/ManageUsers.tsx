import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, Checkbox, Container, Form, Grid, Icon, Input, Message, Modal, Popup } from "semantic-ui-react";
import { UserListingDto, UserResponseDto, UsersApi } from "../../API";
import { apiConfig } from "../../apiInstances";
import CenteredSpinner from "../../Components/CenteredSpinner";
import useErrorHandler from "../../Hooks/useErrorHandler";
import useEndpointData from "../../Hooks/useEndpointData";
import { usePageTitle } from "../../Hooks/usePageTitle";
import NavHeader from "../../Components/NavHeader";

const api = new UsersApi(apiConfig);

// TODO_JU Disable all buttons and modal exits whenever something is loading (across whole application)
// TODO_JU Another pass on the error handling here: Sometimes spinners don't stop spinning etc

interface InviteLinkModalProps {
    inviteKeyUser: InviteKeyUserInfo | null;
    close: () => void;
}

function InviteLinkModal(props: InviteLinkModalProps) {
    const { inviteKeyUser, close } = props;

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

    const inviteLink = `${window.location.origin}/AcceptInvite/${inviteKeyUser?.inviteKey}`;

    const copyButton = <Popup
        open={justCopied}
        content="Copied to clipboard"
        trigger={<Button icon="copy" primary onClick={copyLink} />} />

    return <Modal size="small" open={!!inviteKeyUser}>
        <Modal.Header>Invite link for {inviteKeyUser?.userName ?? '<unnamed>'} ({inviteKeyUser?.fullName})</Modal.Header>
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
    afterResetPassword: (inviteKeyUser: InviteKeyUserInfo) => void;
    cancel: () => void;
}

function ConfirmResetPasswordModal(props: ConfirmResetPasswordModalProps) {
    const { userDto, open, afterResetPassword, cancel } = props;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const errorHandler = useErrorHandler();
    const resetPassword = () => {
        let cancel = false;
        setLoading(true);
        setError('');
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
                if(cancel) return;
                const errorResponse = e as Response;
                if(await errorHandler(errorResponse)) {}
                else if (errorResponse.status === 404)
                    setError('User does not exist');
                else {
                    setError('An unexpected error occurred');
                }
            }
            if(cancel) return;
            if(response) afterResetPassword({
                inviteKey: response.inviteKey!,
                userName: userDto!.loginName!,
                fullName: userDto!.fullName!
            });
            setLoading(false);
        })();
    }

    return <Modal size="tiny" open={open} onClose={() => { setError(''); setLoading(false); cancel(); }}>
        <Modal.Header>Reset password for {userDto?.loginName ?? '<unnamed>'} ({userDto?.fullName})?</Modal.Header>
        <Modal.Content>
            <p>This will disable their account until they open the new invite link.</p>
            {error && <Message error header="Reset Failed" content={error} />}
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
    const [error, setError] = useState('');
    useEffect(() => { if(open) setError(''); }, [open]);

    const errorHandler = useErrorHandler();
    const deleteUser = () => {
        let cancel = false;
        setLoading(true);
        setError('');
        (async () => {
            try {
                await api.usersUserIdDelete({ userId: userDto?.id! });
            } catch(e) {
                if(cancel) return;
                const errorResponse = e as Response;
                if(await errorHandler(errorResponse)) return;
                else if (errorResponse.status === 404) {
                    setError('User does not exist');
                    setLoading(false);
                }
                else {
                    setError('An unexpected error occurred');
                }
                return;
            }
            if(cancel) return;
            afterDeleteUser();
            setLoading(false);
        })();
    }

    return <Modal size="tiny" open={open} onClose={cancel}>
        <Modal.Header>Delete user {userDto?.loginName ?? '<unnamed>'} ({userDto?.fullName})?</Modal.Header>
        <Modal.Content>
            <p>This action is permanent</p>
            {error && <Message error header="Reset Failed" content={error} />}
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
        setError('');
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
    const [error, setError] = useState('');
    const errorHandler = useErrorHandler();
    const save = useCallback(() => {
        let cancel = false;
        setLoading(true);
        setError('');
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
                if(cancel) return;
                const errorResponse = e as Response;
                if(await errorHandler(errorResponse)) return;
                else if (errorResponse.status === 404) {
                    setError('User does not exist');
                    setLoading(false);
                }
                else {
                    setError('An unexpected error occurred');
                }
                return;
            }
            if(cancel) return;
            reloadList();
            setLoading(false);
        })();
        return () => { cancel = true; };
    }, [newFullName, newIsAdministrator, id, reloadList, errorHandler]);

    return <Card>
        <Card.Content>
            <Card.Header>
                {activated
                    ? <Icon name="user" />
                    : <Popup trigger={<Icon name="lock" />} content={`'${loginName ?? '<unnamed>'}' is locked out pending password reset`} />
                }
                {loginName ?? '<unnamed>'}
            </Card.Header>
            <Card.Meta>{fullName}{isAdministrator ? " (Admin)" : ""}</Card.Meta>
            {
                editMode && <>
                    <Form error={!!error} style={{ paddingTop: '1.5rem' }}>
                        <Form.Field>
                            <Form.Input placeholder="Full Name" disabled={loading} value={newFullName} onChange={e => setNewFullName(e.target.value)} />
                        </Form.Field>
                        <Form.Field>
                            <Checkbox label="Admin" disabled={loading} checked={newIsAdministrator} onChange={() => setNewIsAdministrator(!newIsAdministrator)} />
                        </Form.Field>
                        <Message error header="Edit Failed" content={error} />
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
    afterAddUser: (user: InviteKeyUserInfo) => void;
}

function NewUserCard(props: NewUserCardProps) {
    const { afterAddUser } = props;

    const [newUserFullName, setNewUserFullName] = useState('');
    const [newUserIsAdmin, setNewUserIsAdmin] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const errorHandler = useErrorHandler();
    const add = useCallback(() => {
        let cancel = false;
        setLoading(true);
        setError('');
        (async () => {
            let response: UserResponseDto;
            try {
                response = await api.usersPost({
                    userAddRequestDto: {
                        fullName: newUserFullName,
                        isAdministrator: newUserIsAdmin
                    }
                });
            } catch(e) {
                if(cancel) return;
                const errorResponse = e as Response;
                if(await errorHandler(errorResponse)) return;
                else {
                    setError('An unexpected error occurred');
                    setLoading(false);
                }
                return;
            }
            if(cancel) return;
            afterAddUser({
                userName: null,
                fullName: newUserFullName,
                inviteKey: response.inviteKey!
            });
            setLoading(false);
        })();
        return () => { cancel = true; };
    }, [newUserFullName, newUserIsAdmin, afterAddUser, errorHandler]);

    return <Card>
        <Card.Content>
            <Card.Header>
                <Icon name="add user" />
                New User
            </Card.Header>
            <Form error={!!error} style={{ paddingTop: '1.5rem' }}>
                <Form.Field>
                    <Form.Input disabled={loading} placeholder="Full Name" value={newUserFullName} onChange={e => setNewUserFullName(e.target.value)} />
                </Form.Field>
                <Form.Field>
                    <Checkbox disabled={loading} label="Admin" checked={newUserIsAdmin} onChange={e => setNewUserIsAdmin(!newUserIsAdmin)}/>
                </Form.Field>
                <Message error header="Add Failed" content={error} />
            </Form>
        </Card.Content>
        <Card.Content extra>
            <div style={{float: 'right'}}>
                <Popup trigger={<Button onClick={add} disabled={!newUserFullName} loading={loading} positive size="small" icon="check" />} content="Add" />
            </div>
        </Card.Content>
    </Card>;
}

interface InviteKeyUserInfo {
    inviteKey: string;
    fullName: string;
    userName: string | null;
}

function ManageUsers() {
    usePageTitle('Manage Users');

    const errorHandler = useErrorHandler();
    const [listingError, setListingError] = useState(false);
    const [users, loadingUsers, reloadUsers] = useEndpointData(
        useCallback(() => api.usersGet(), []),
        useCallback(async e => {
            const response = e as Response;
            if(await errorHandler(response)) return;
            else {
                console.error('Unexpected response from user listing endpoint:');
                console.error(e);
                console.error(await response.text());
                setListingError(true);
            }
        }, [errorHandler]));

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
    const [inviteKeyUser, setInviteKeyUser] = useState<InviteKeyUserInfo | null>(null);

    const cards = listingError ? <Message error header="Loading Users Failed" content='An unexpected error occurred' />
        : loadingUsers ? <CenteredSpinner />
        : <Card.Group doubling stackable itemsPerRow={4} style={{ marginTop: "1rem" }}>
        {
            filteredUsers!.map(u => <UserCard
                key={u.id!}
                userDto={u}
                setConfirmDeleteUser={() => setConfirmDeleteUser(u)}
                reloadList={reloadUsers}
                resetPassword={() => setResetPasswordUser(u)}
                />)
        }
            <NewUserCard afterAddUser={inviteKeyUser => { setInviteKeyUser(inviteKeyUser); reloadUsers(); }} />
        </Card.Group>;

    return <Container>
        <NavHeader pageTitle="Manage Users" />
        <Grid stackable columns={3}>
            <Grid.Column>
                <Input autoFocus fluid icon="filter" iconPosition="left" placeholder="Filter"
                    value={textFilter} onChange={e => setTextFilter(e.target.value.toLocaleLowerCase())} />
            </Grid.Column>
            <Grid.Column>
                <Button.Group fluid style={{ height: '100%' }}>
                    <Button secondary active={activeStatusFilter === true} onClick={() => setActiveStatusFilter(true)}>Active</Button>
                    <Button secondary active={activeStatusFilter === false} onClick={() => setActiveStatusFilter(false)}>Locked</Button>
                    <Button secondary active={activeStatusFilter === null} onClick={() => setActiveStatusFilter(null)}>All</Button>
                </Button.Group>
            </Grid.Column>
            <Grid.Column>
                <Button.Group fluid style={{ height: '100%' }}>
                    <Button secondary active={adminFilter === true} onClick={() => setAdminFilter(true)}>Admins</Button>
                    <Button secondary active={adminFilter === false} onClick={() => setAdminFilter(false)}>Users</Button>
                    <Button secondary active={adminFilter === null} onClick={() => setAdminFilter(null)}>All</Button>
                </Button.Group>
            </Grid.Column>
        </Grid>
        {cards}
        <ConfirmResetPasswordModal
            userDto={resetPasswordUser}
            open={!!resetPasswordUser && !inviteKeyUser}
            afterResetPassword={inviteKeyUser => { setInviteKeyUser(inviteKeyUser); reloadUsers(); }}
            cancel={() => setResetPasswordUser(null)} />
        <InviteLinkModal
            inviteKeyUser={inviteKeyUser}
            close={() => { setInviteKeyUser(null); }} />
        <DeleteUserModal
            open={!!confirmDeleteUser}
            userDto={confirmDeleteUser}
            cancel={() => setConfirmDeleteUser(null)}
            afterDeleteUser={() => { setConfirmDeleteUser(null); reloadUsers(); }} />
    </Container>;
}

export default ManageUsers;