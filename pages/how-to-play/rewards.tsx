import { useRouter } from "next/router";
import { Button } from "../../components/button";
import { ContentBox } from "../../components/contentBox";
import { FooterButtons } from "../../components/footerButtons";

export default function Page() {
    const router = useRouter();

    return (
        <div className='center'>
            <ContentBox >
                <h1>REWARDS</h1><br />
                <p>Teams earn points based on how many of their cells are alive at the start of each evolution.</p>
                <p>Placing a cell costs 0.001 ETH.</p>
                <p>At the end of the game, the winning team earns back their ETH, plus the ETH spent by the losing team.</p>
                <p>Rewards are distributed according to how much you contributed to your team. If you spent 30% of the funds for your team in a game, you receive 30% of the reward pool.</p>
            </ContentBox>
            <FooterButtons>
                <Button onClick={() => { router.push('/how-to-play/game') }}>Go Back</Button>
                <Button onClick={() => { router.push('/how-to-play/enjoy') }}>
                    Continue
                </Button>
            </FooterButtons>
        </div>
    )
}
