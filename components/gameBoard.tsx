import * as React from 'react';
import styles from '../styles/game.module.css';
import { GRID_SIZE } from '../constants/utils';


export function GameBoard({ grid, cellClickCB }: { grid: number[][], cellClickCB: (x: number, y: number) => void }) {

    return (
        <div className={styles.gameCanvas}>
            {[...Array(GRID_SIZE)].map((_, x) =>
                [...Array(GRID_SIZE)].map((_, y) => <Cell x={x} y={y} value={grid[x][y]} cb={cellClickCB} />)
            )}
        </div>
    )
}

function Cell({ x, y, value, cb }: { x: number, y: number, value: number, cb: (x: number, y: number) => void }) {
    return (
        <div className={styles[`team-${value.toString() || 0}`]} onClick={() => cb(x, y)} />
    )
}
