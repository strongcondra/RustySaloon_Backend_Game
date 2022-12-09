import React from 'react'
import mainLogo from '../components/sidenav/roulette.png'
import fxLogo from '../components/sidenav/50x.png'
import fxDice from '../components/sidenav/dice.png'
import fxCrash from '../components/sidenav/crash.png'
import fxTowers from '../components/sidenav/towers.png'
import fxMines from '../components/sidenav/mines.png'
import fxCups from '../components/sidenav/cups.png'

export const SideNavData = [
    {
        title: 'Roulette',
        path: '/',
        icon: <img src={mainLogo}></img>,
        cName: 'sidenav-text'
    },
    {
        title: 'Crash',
        path: '/',
        icon: <img src={fxCrash}/>,
        cName: 'sidenav-text'
    },
    {
        title: '50X',
        path: '/',
        icon: <img src={fxLogo}/>,
        cName: 'sidenav-text'
    },
    {
        title: 'Cups',
        path: '/',
        icon: <img src={fxCups}/>,
        cName: 'sidenav-text'
    },
    {
        title: 'Towers',
        path: '/',
        icon: <img src={fxTowers}/>,
        cName: 'sidenav-text'
    },
    {
        title: 'Mines',
        path: '/',
        icon: <img src={fxMines}/>,
        cName: 'sidenav-text'
    },
    {
        title: 'Dice',
        path: '/',
        icon: <img src={fxDice}/>,
        cName: 'sidenav-text'
    },
]
