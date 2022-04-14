import { Header, Icon } from "semantic-ui-react";
import { routes } from "../../routes";
import SkinnyForm from "../../Components/SkinnyForm";
import ThemeRule from "../../Components/ThemeRule";
import { usePageTitle } from "../../Hooks/usePageTitle";

function Unauthorised() {
    usePageTitle('Unauthorised');

    return <SkinnyForm>
        <Header as="h1">Restricted Area<ThemeRule /></Header>
        <p>You are not authorised to view this page</p>
        <a href={routes.browseFiles.url}>
            <Icon link name="home" size="large" style={{float: 'right'}} />
        </a>
    </SkinnyForm>;
}

export default Unauthorised;