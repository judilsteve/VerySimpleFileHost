import { Header } from "semantic-ui-react";
import { routes } from "../../App";
import IconLink from "../../Components/IconLink";
import SkinnyForm from "../../Components/SkinnyForm";
import { usePageTitle } from "../../Hooks/usePageTitle";

function NotFound() {
    usePageTitle('Not Found');

    return <SkinnyForm>
        <Header as="h1">Wrong Turn</Header>
        <p>Could not find the requested page</p>
        <IconLink href={routes.browseFiles} name="home" size="large" style={{float: 'right'}} />
    </SkinnyForm>;
}

export default NotFound;