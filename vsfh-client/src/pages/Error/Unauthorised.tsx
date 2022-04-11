import { Header, Icon } from "semantic-ui-react";
import { routes } from "../../Routes";
import SkinnyForm from "../../Components/SkinnyForm";
import ThemeRule from "../../Components/ThemeRule";
import { usePageTitle } from "../../Hooks/usePageTitle";
import Link from "next/link"

function Unauthorised() {
    usePageTitle('Unauthorised');

    return <SkinnyForm>
        <Header as="h1">Restricted Area<ThemeRule /></Header>
        <p>You are not authorised to view this page</p>
        <Link href={routes.browseFiles}>
            <a><Icon link name="home" size="large" style={{float: 'right'}} /></a>
        </Link>
    </SkinnyForm>;
}

export default Unauthorised;