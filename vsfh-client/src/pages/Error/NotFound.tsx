import Link from "next/link";
import { Header, Icon } from "semantic-ui-react";
import { routes } from "../../Routes";
import SkinnyForm from "../../Components/SkinnyForm";
import ThemeRule from "../../Components/ThemeRule";
import { usePageTitle } from "../../Hooks/usePageTitle";

function NotFound() {
    usePageTitle('Not Found');

    return <SkinnyForm>
        <Header as="h1">Wrong Turn<ThemeRule /></Header>
        <p>The requested page could not be found</p>
        <Link href={routes.browseFiles}>
            <a><Icon link name="home" size="large" style={{float: 'right'}} /></a>
        </Link>
    </SkinnyForm>;
}

export default NotFound;