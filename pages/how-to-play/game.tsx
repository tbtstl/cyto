import { useRouter } from "next/router";
import { Button } from "../../components/button";
import { ContentBox } from "../../components/contentBox";
import { FooterButtons } from "../../components/footerButtons";

export default function Page() {
    const router = useRouter();

    return (
        <div className='center'>
            <ContentBox >
                <h1>PLAYING THE GAME</h1><br />
                <p>A single game lasts 24 hours.</p>
                <p>
                    During the game, you can place your team's cells on the board. You can only place cells in unoccupied locations. Every 15 minutes, the board evolves. The board evolves according to four simple rules:</p>
                <p>Any cell with fewer than two neighbors dies, as if by <b>underpopulation</b>.</p>
                <img style={{ height: '2.5rem' }} src="/img/under.svg" alt="" />
                <p>Any cell with two or three neighbors lives on to the next generation.</p>
                <img style={{ height: '2.5rem' }} src="/img/stable.svg" alt="" />
                <p>Any cell with more than three neighbors dies, as if by <b>overpopulation</b>.</p>
                <img style={{ height: '2.5rem' }} src="/img/over.svg" alt="" />
                <p>Any empty location with exactly three live neighbors becomes a live cell, as if by <b>reproduction</b>. The live cell joins the team of the most common team of its neighbors.</p>
                <img style={{ height: '2.5rem' }} src="/img/regen.svg" alt="" />
                <p></p>
            </ContentBox>
            <FooterButtons>
                <Button onClick={() => { router.push('/how-to-play/teams') }}>Go Back</Button>
                <Button onClick={() => { router.push('/how-to-play/rewards') }}>
                    Continue
                </Button>
            </FooterButtons>
        </div>
    )
}
