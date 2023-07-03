'use client'
import * as React from 'react'
import './styles/globals.css'
import { ContentBox } from './components/contentBox'


export default function Page() {
    const buttons = [{ onClick: () => { }, content: 'Connect to ZORA' }, { onClick: () => { }, content: 'How to Play' }]
    return (
        <ContentBox center={true} buttons={buttons}>
            <h1>CELLULAR ENERGY</h1>
            <p>CELLULAR ENERGY is a game of cell evolution.</p>
            <p>
                The goal of the game is to ensure your team’s cells occupy the majority of the board every evolution. If your team wins, you win ETH.</p>
        </ContentBox>
    )
}
