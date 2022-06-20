import { h } from 'preact';
import 'semantic-ui-less/definitions/elements/header.less';
import 'semantic-ui-less/definitions/elements/icon.less';
import { Header, Icon } from "semantic-ui-react";
import { routes } from "../../routes";
import SkinnyForm from "../../Components/SkinnyForm";
import ThemeRule from "../../Components/ThemeRule";

function Unauthorised() {
    return <SkinnyForm>
        <Header as="h1">Restricted Area<ThemeRule /></Header>
        <p>You are not authorised to view this page</p>
        <a aria-label="Home" href={routes.browseFiles.pathname}>
            <Icon link name="home" size="large" style={{float: 'right'}} />
        </a>
    </SkinnyForm>;
}

export default Unauthorised;