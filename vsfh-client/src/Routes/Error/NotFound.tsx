import 'semantic-ui-less/definitions/elements/header.less';
import 'semantic-ui-less/definitions/elements/icon.less';
import { Header, Icon } from "semantic-ui-react";
import { routes } from "../../routes";
import SkinnyForm from "../../Components/SkinnyForm";
import ThemeRule from "../../Components/ThemeRule";
import { usePageTitle } from "../../Hooks/usePageTitle";

function NotFound() {
    usePageTitle('Not Found');

    return <SkinnyForm>
        <Header as="h1">Wrong Turn<ThemeRule /></Header>
        <p>The requested page could not be found</p>
        <a href={routes.browseFiles.url}>
            <Icon link name="home" size="large" style={{float: 'right'}} />
        </a>
    </SkinnyForm>;
}

export default NotFound;