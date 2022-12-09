import React,{useState} from 'react'
import {SideNavData} from './SideNavData'
import './sidenav.css'

const SideNav = () => {
    const [sidebar, setSidebar] = useState(false);
    const showSidebar = () => setSidebar(!sidebar);

    return (
        <>
        <section className="sidenav-container">
          <div className="sidenav">
            <a href="#home" className="sidenav-bars">
                First one
            </a>
          </div>
          <nav className={sidebar ? 'sidenav sidenavActive' : 'sidenav-menu'}>
            <ul className="sidenav-menu-items">
                <li className="sidenav-toggle">
                    <a href="#roulette">Rouletter</a>
                </li>
                <div style={{marginTop:'4rem'}}>
                {SideNavData.map((item,index) => {
                    return (
                        <li key={index} className={item.cName}>
                            <a href={item.path}>
                                {item.icon}
                                <div style={{textAlign:'left !important'}}>
                                  <span>{item.title}</span>  
                                </div>
                            </a>
                        </li>
                    )
                })}
                </div>
            </ul>
          </nav>
        </section>
        </>
    )
}

export default SideNav
