import { useRouter } from "next/router";
import { Button } from "../../components/button";
import { ContentBox } from "../../components/contentBox";
import { FooterButtons } from "../../components/footerButtons";

export default function Page() {
    const router = useRouter();

    return (
        <div className='center'>
            <ContentBox >
                <h1>TEAMS</h1><br />
                <p>There are only two teams, <span className="red">Team Red</span> and <span className="blue">Team Blue</span>.</p>
                <p>
                    You can only join a team once.
                </p>
            </ContentBox>
            <FooterButtons>
                <Button onClick={() => { router.push('/how-to-play') }}>Go Back</Button>
                <Button onClick={() => { router.push('/how-to-play/game') }}>
                    Continue
                </Button>
            </FooterButtons>
        </div>
    )
}
