import twitter from "../assets/twitter.svg";
import linkedin from "../assets/linkedin.svg";
import facebook from "../assets/facebook.svg";

const Footer = () => {
  return (
    <footer className="mt-16 border-t">
      <div className="h-[3px] w-full bg-gradient-to-r from-[#8A5DD6] via-[#8A5DD6]/30 to-transparent" />
      <div className="container mx-auto px-6 md:px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-gray-500">© {new Date().getFullYear()} Mitra. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <a className="text-sm text-gray-600 hover:text-[#8A5DD6] transition-colors" href="#services">Services</a>
          <a className="text-sm text-gray-600 hover:text-[#8A5DD6] transition-colors" href="/faqs">FAQs</a>
          <a className="text-sm text-gray-600 hover:text-[#8A5DD6] transition-colors" href="/contact_us">Contact</a>
        </div>
        <div className="flex items-center gap-3">
          <a href="https://twitter.com" aria-label="Twitter"><img src={twitter} alt="Twitter" className="h-5 w-5 opacity-70 hover:opacity-100 transition-opacity" /></a>
          <a href="https://linkedin.com" aria-label="LinkedIn"><img src={linkedin} alt="LinkedIn" className="h-5 w-5 opacity-70 hover:opacity-100 transition-opacity" /></a>
          <a href="https://facebook.com" aria-label="Facebook"><img src={facebook} alt="Facebook" className="h-5 w-5 opacity-70 hover:opacity-100 transition-opacity" /></a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
