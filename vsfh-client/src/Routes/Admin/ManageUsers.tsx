import { useNavigate } from "react-router";
import { Container } from "semantic-ui-react";
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

    return <>{
        users!.map(u => <Container key={u.id}>
            TODO_JU Controls for user {u.fullName}
        </Container>)
    }</>;
}

export default ManageUsers;