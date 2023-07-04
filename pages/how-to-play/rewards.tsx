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
                <p>Placing a cell costs ETH. The cost increases with each game in the season.</p>
                <p>It costs 0.0001 ETH to place a cell in game 1. It increases to 0.0007 ETH by game 7.</p>
                <p>At the end of the season, the winning team earns back their ETH, plus the ETH spent by the losing team.</p>
                <p>Rewards are distributed according to how much you contributed to your team. If you placed 30% of the cells for a season, you receive 30% of the reward pool.</p>
                <p>
                    At the end of each season you can join a new team.
                </p>
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
