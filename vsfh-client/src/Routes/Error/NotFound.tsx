import { Link } from "react-router-dom";
import { Header, Icon } from "semantic-ui-react";
import { routes } from "../../App";
import SkinnyForm from "../../Components/SkinnyForm";
import ThemeRule from "../../Components/ThemeRule";
import { usePageTitle } from "../../Hooks/usePageTitle";

function NotFound() {
    usePageTitle('Not Found');

    return <SkinnyForm>
        <Header as="h1">Wrong Turn<ThemeRule /></Header>
        <p>Could not find the requested page</p>
        <Link to={routes.browseFiles}>
            <Icon link name="home" size="large" style={{float: 'right'}} />
        </Link>
    </SkinnyForm>;
}

export default NotFound;