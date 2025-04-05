import googleLogo from "../assets/google.svg";
import trelloLogo from "../assets/trello_logo_icon_168452.png";
import mondayLogo from "../assets/Monday.png";
import partnerLogo from "../assets/5cb480b85f1b6d3fbadece78.png";

const Footer = () => {
  return (
    <footer className="flex flex-wrap justify-center items-center space-x-10 p-3 bg-purple-100">
      <img src={googleLogo} className="h-10" alt="Google" />
      <img src={trelloLogo} className="h-10" alt="Trello" />
      <img src={mondayLogo} className="h-10" alt="Monday" />
      <img src={partnerLogo} className="h-10" alt="Partner" />
    </footer>
  );
};

export default Footer;
