import React from "react";

import Bonus from "./home/bonus";
import Features from "./home/features";
import Hero from "./home/hero";
import PageLayout from "./page-layout";

const Home: React.VoidFunctionComponent = () => {
  return (
    <PageLayout>
      <Hero />
      <Features />
      <Bonus />
    </PageLayout>
  );
};

export default Home;
