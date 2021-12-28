import { Header } from "semantic-ui-react";
import { routes } from "../App";
import IconLink from "./IconLink";
import SkinnyForm from "./SkinnyForm";
import ThemeRule from "./ThemeRule";
import { usePageTitle } from "../Hooks/usePageTitle";

function Unauthorised() {
    usePageTitle('Unauthorised');

    return <SkinnyForm>
        <Header as="h1">Restricted Area<ThemeRule /></Header>
        <p>You are not authorised to view this page</p>
        <IconLink href={routes.browseFiles} name="home" size="large" style={{float: 'right'}} />
    </SkinnyForm>;
}

export default Unauthorised;