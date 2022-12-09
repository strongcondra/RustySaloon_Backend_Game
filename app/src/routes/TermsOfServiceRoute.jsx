import React from "react";
import Chat from "../components/Chat";
import MobileHeader from "../components/desktop/Header";
import Dice from "../components/games/dice/Dice";
import DesktopHeader from "../components/mobile/Header";
import MobileNav from "../components/mobile/Nav";

const TermsOfServiceRoute = (props) => {
  return (
    <React.Fragment>
      {/* <DesktopHeader />
      <MobileHeader />
      <Chat />
      <MobileNav /> */}

      <div className="page-content">
        <div className="terms-of-service">
          <h1>Terms of Service</h1>
          <p>
            Please read the terms of this site carefully before accessing or
            using the website. By using or accessing the website, you agree to
            be bound to the following terms.
          </p>
          <b>Minimum Age Requirement:</b>
          <p>
            In order to be eligible to play on RustySaloon.com you must be 18
            years of age or older. This website is only offered and available to
            users who are 18 years of age or older. You must also be of legal
            age to form a binding contract with the Rusty Saloon LLC.
          </p>
          <b>Restricted Jurisdictions:</b>
          <p>
            RustySaloon.com is only to be used in permitted jurisdictions. If
            you are in a restricted jurisdiction, you are prohibited from using
            RustySaloon.com gaming services in any way. We do not claim that
            RustySaloon.com is available in all regions. You are responsible for
            making sure that you act in accordance and comply with your local
            laws.{" "}
          </p>
          <b>Consent to electronic communication: </b>
          <p>
            You agree that any communications such as site wide announcements,
            admin messages, and site communication to the user are considered to
            be part of the website and you will not be able to opt-out of any in
            site messages that may appear when accessing or using the website.{" "}
          </p>
          <b>Agreements </b>
          <p>
            By using this website, you agree that you are of legal age to form a
            binding contract with the company (RustySaloon LLC), meet all of the
            foregoing eligibility requirements, and comply with all the terms
            and conditions in the Terms of Service. By accessing and using this
            site, you confirm that you agree to the Terms of Service. We may
            revise the Terms of Service in the future, all further changes are
            effective immediately when we post them, and apply to all access and
            further use of the website.
          </p>
          <b>Accessing the Website and Account Security:</b>
          <p>
            We will not be liable if any or all parts of the website are
            unavailable for any period of time. We may take away access to some
            parts of the website, or the entire website if we need to implement
            updates or changes to the website. We also reserve the right to make
            necessary unscheduled deployments of changes, or updates to the
            website at any time we see fit. We may add new features, gamemodes,
            or improved functionality to the website at any time, which allows
            us to suspend or stop the website altogether at any time.
          </p>
          <b>Responsibility of the user: </b>
          <p>
            By using this site you are ensuring that all users on your local
            connection accessing the site are aware of these terms and comply
            with them without reservation. You agree to sign in and share your
            trading information through Steam® which is provided by Valve Corp.
            You agree that information is both current and correct. You agree
            that all information you provide can be used by us in accordance
            with Valve Corps privacy policy. You are solely responsible for
            managing both your account and password and keeping your credentials
            confidential. You are also accountable for restricting your account
            from others. You agree that you are responsible for all activities
            that occur on your account. If you believe your password has become
            compromised or a third party has access to your account, reset your
            account and create a new one, or clear your API key found on Steam®.
            You agree not to allow a third party to use or access your account.
            You must treat all of your information as confidential, you cannot
            disclose your information with any other person or entity. You agree
            to notify us immediately if any unauthorized access to this website
            is used by your account. It is your responsibility to be careful
            when accessing your account through public/shared computers. You can
            use the “logout” feature found by clicking your name in the top
            right corner which will bring you to your profile page. It is
            strictly forbidden to use multiple accounts on this site and we
            reserve the right to ban any users who are found to have multiple
            accounts.We reserve the right to terminate, suspend, or disable any
            user, for any reason, at any time. RustySaloon.com is not
            responsible for losses due to connectivity issues.
          </p>
          <b>Third-Party Intellectual Property Rights:</b>
          <p>
            Steam® is a registered trademark of Valve Corporation. The Company
            is not endorsed by nor affiliated in any way with Valve Corp, Rust,
            Steam®, or any other trademarks of Valve Corp. Valve. The Valve logo
            are trademarks of Valve Corp. All other trademarks such as the Rust
            logo, Rust, Rust Skins, and all other trademarks are all owned by
            Facepunch Studios.{" "}
          </p>
          <b> Purpose of Website and Pricing:</b>
          <p>
            This website is for entertainment purposes only. Our sole purpose is
            to be able to obtain virtual items by playing different game modes
            featured on the website. Increasing your site balance can be done by
            depositing more skins. Our site offers no way to withdraw real
            money. We do not provide opportunities to win real money. The items
            prices on our site do not represent any real world value
          </p>

          <b> Limitation on Liablity:</b>
          <p>
            In no event will Rusty Saloon LLC, it’s affiliates, service
            providers, employees, developers, officers be held liable for
            damages of any kind, under any legal theory, arising from your use,
            or inability to use the website, or any content on the website. This
            includes direct, indirect, special,punitive damages including but
            not limited to personal injury, pain and suffering, loss of revenue,
            loss of profits, loss of business, loss of data, loss of savings,
            loss of goodwill . The rest of the contract does not affect any
            liability which cannot be excluded or limited by applicable
            liability law.
          </p>
        </div>
      </div>
    </React.Fragment>
  );
};

export default TermsOfServiceRoute;
