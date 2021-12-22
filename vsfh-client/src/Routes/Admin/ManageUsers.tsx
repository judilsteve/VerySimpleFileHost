import { useCallback } from "react";
import { useNavigate } from "react-router";
import { Button, Checkbox, Container, Input, Popup } from "semantic-ui-react";
import { Configuration, UserListingDto, UsersApi } from "../../API";
import { routes } from "../../App";
import CenteredSpinner from "../../Components/CenteredSpinner";
import useEndpointData from "../../Hooks/useEndpointData";

//const api = new UsersApi(new Configuration({ basePath: window.location.origin })); // TODO_JU Shared instances for this?

const fakeUsers: UserListingDto[] = [
    {
        id: 'asd',
        fullName: 'Duke Nukem',
        loginName: 'duke123',
        isAdministrator: true,
        activated: true
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
        }, []));

    if(loadingUsers) return <CenteredSpinner />;

    return <>
    {
        users!.map(u => <Container key={u.id}>
            <Input placeholder="Full Name" value={u.fullName} />
            {u.loginName}
            <Checkbox label="Administrator" checked={u.isAdministrator} />
            <Popup trigger={<Button icon="save" />} content="Save Changes" />
            <Popup trigger={<Button icon="redo"/>} content="Clear Changes" />
            TODO_JU Active/inactive indicator
            <Popup trigger={<Button icon="unlock" />} content="Reset Password" />
            <Popup trigger={<Button icon="remove user" />} content="Delete User" />
        </Container>)
    }
        <Container>
            TODO_JU Controls for new user
        </Container>
    </>;
}

export default ManageUsers;