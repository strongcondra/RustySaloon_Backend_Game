import React, { useState } from "react";

const FAQ = props => {
  return (
    <div className="faq">
      <h1>Frequently asked questions</h1>

      <Item
        question="How can we prove our games are fair?"
        answer="Our site uses randomly generated hashes to make the games fair. More information can be found in our Provably Fair section. By entering the round ticket and round secret, you can verify the gamemode’s fairness for that round. "
      />
      <Item
        question="Why can't I deposit?"
        answer="Please make sure that your Steam profile is public and that your linked trade url is correct. If this does not work please contact support by making a ticket in our discord. Your trade url can be found by clicking on the set new trade-url button on the profile page and copying the link at the bottom."
      />
      <Item question="I deposited items but I was not credited?" answer="" />
      <Item
        question="Why can't I claim faucet money or redeem a code?"
        answer="This may be due to having a private steam profile or not owning Rust. It could also be that you may not have “RustySaloon.com” in your steam name. Once you have updated your steam name, please log out and log back into the site. If the problem persists, please contact support."
      />
      <Item
        question="I have found a bug, what should I do?"
        answer="Please contact our support with the issue and we will get on it ASAP. A possible reward could be given based on the importance of the bug."
      />
      <Item
        question="I have a question, and would like to contact support. How do I contact support?"
        answer="Join our Discord (icon in top right) and we will do our best to answer any of your questions. If there is a problem, create a support ticket in our Discord "
      />
      <Item
        question="How do I mute sounds?"
        answer="Click on your name in the top right and you will be brought to the profile page. This is where you mute sounds."
      />
    </div>
  );
};

const Item = props => {
  const [collapsed, setCollapsed] = useState(true);
  return (
    <div
      onClick={() => setCollapsed(!collapsed)}
      className={"faq__item " + (collapsed ? "faq__item--collapsed" : "")}
    >
      <div className="faq__item-question">
        {props.question}{" "}
        <img src={process.env.PUBLIC_URL + "/images/expand.svg"} />
      </div>
      <div className="faq__item-answer">{props.answer}</div>
    </div>
  );
};

export default FAQ;
