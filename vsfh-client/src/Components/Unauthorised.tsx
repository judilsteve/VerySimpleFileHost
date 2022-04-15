import 'semantic-ui-less/definitions/elements/header.less';
import 'semantic-ui-less/definitions/elements/icon.less';
import { Header, Icon } from "semantic-ui-react";
import { routes } from "../App";
import SkinnyForm from "./SkinnyForm";
import ThemeRule from "./ThemeRule";
import { usePageTitle } from "../Hooks/usePageTitle";
import { Link } from "react-router-dom";

function Unauthorised() {
    usePageTitle('Unauthorised');

    return <SkinnyForm>
        <Header as="h1">Restricted Area<ThemeRule /></Header>
        <p>You are not authorised to view this page</p>
        <Link to={routes.browseFiles}>
            <Icon link name="home" size="large" style={{float: 'right'}} />
        </Link>
    </SkinnyForm>;
}

export default Unauthorised;