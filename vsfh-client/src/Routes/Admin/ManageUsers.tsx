import { useNavigate } from "react-router";
import { Button, Checkbox, Container, Input } from "semantic-ui-react";
import { Configuration, UsersApi } from "../../API";
import { routes } from "../../App";
import CenteredSpinner from "../../Components/CenteredSpinner";
import useEndpointData from "../../Hooks/useEndpointData";

const api = new UsersApi(new Configuration({ basePath: window.location.origin })); // TODO_JU Shared instances for this?

function ManageUsers() {
    // TODO_JU This route and file browser should have navigation and a logout button

    const navigate = useNavigate();
    const [users, loadingUsers] = useEndpointData(
        () => api.usersGet(),
        e => {
            const response = e as Response;
            if(response.status === 403)
                navigate(routes.unauthorised);
            else navigate(routes.serverError);
        });

    if(loadingUsers) return <CenteredSpinner />;

    return <>
    {
        users!.map(u => <Container key={u.id}>
            <Input placeholder="Full Name" value={u.fullName} />
            {u.loginName }
            <Checkbox label="Remember me" checked={u.isAdministrator} />
            <Button icon="check">Save</Button>
            <Button icon="cross">Clear</Button>
            TODO_JU Active/inactive indicator
            <Button icon="unlock">Reset Password</Button>
            <Button icon="remove user">Delete</Button>
        </Container>)
    }
        <Container>
            TODO_JU Controls for new user
        </Container>
    </>;
}

export default ManageUsers;