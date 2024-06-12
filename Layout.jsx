import React from 'react'
import Header from '../Components/Header/Header';
import Footer from '../Components/Footer/Footer';
import Routers from '../routers/Routers';
const Layout = () => {
  return (
    <>
    <Header />
    <main>
    <Routers />
    </main>
    <Footer />
    </>
  )
}

export default Layout;
