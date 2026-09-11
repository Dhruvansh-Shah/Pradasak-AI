const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../services/ChatOrchestrator.ts');
let content = fs.readFileSync(targetFile, 'utf8');

// Find start of block
const startMarker = "    } else if (lastToolName === 'recommend_schemes' && lastToolData?.schemes) {";
const endMarker = "      speechText = finalText;\n    }\n  }\n\n  finalText = stripMarkdown(finalText);";
const endMarkerCRLF = "      speechText = finalText;\r\n    }\r\n  }\r\n\r\n  finalText = stripMarkdown(finalText);";

const startIdx = content.indexOf(startMarker);
if (startIdx === -1) {
  console.error("Could not find startMarker");
  process.exit(1);
}

let endIdx = content.indexOf("finalText = stripMarkdown(finalText);", startIdx);
if (endIdx === -1) {
  console.error("Could not find endIdx");
  process.exit(1);
}

// Slice to find the closing brackets before finalText = stripMarkdown(finalText);
const beforeFinal = content.slice(startIdx, endIdx);

const replacement = `    } else if (lastToolName === 'recommend_schemes' && lastToolData?.schemes) {
      const schemes = (lastToolData.schemes as Scheme[]) || [];
      const lowerMsg = message.toLowerCase();
      const isEdu = schemes.some((s) => s.category === 'education_loan') || /educat|study|college|school|student|degree|course|vocational|scholarship|b\\.?tech|m\\.?tech|mbbs|fees|admission/i.test(lowerMsg);

      if (isEdu) {
        finalText = session.language === 'hi'
          ? 'आपकी शिक्षा के लिए NSFDC द्वारा उपलब्ध प्रमुख ऋण योजनाएं नीचे दी गई हैं। इनमें उच्च शिक्षा के लिए ₹40 लाख तक (ELS) तथा व्यावसायिक कौशल प्रशिक्षण के लिए ₹4 लाख तक (VETLS) रियायती ब्याज दर पर उपलब्ध है। आप किस पाठ्यक्रम या डिग्री के लिए आवेदन करना चाहते हैं?'
          : session.language === 'mr'
          ? 'तुमच्या शिक्षणासाठी NSFDC द्वारे उपलब्ध मुख्य शैक्षणिक कर्ज योजना खाली दिल्या आहेत. यामध्ये उच्च शिक्षणासाठी ₹40 लाखांपर्यंत (ELS) आणि व्यावसायिक कौशल्य प्रशिक्षणासाठी ₹4 लाखांपर्यंत (VETLS) सवलतीच्या व्याजदरात कर्ज उपलब्ध आहे. तुम्हाला कोणत्या अभ्यासक्रमासाठी कर्ज हवे आहे?'
          : session.language === 'bn'
          ? 'আপনার শিক্ষার জন্য NSFDC দ্বারা উপলব্ধ প্রধান শিক্ষামূলক ঋণ প্রকল্পগুলি নীচে দেওয়া হল। উচ্চ শিক্ষার জন্য ₹40 লক্ষ পর্যন্ত (ELS) এবং বৃত্তিমূলক প্রশিক্ষণের জন্য ₹4 লক্ষ পর্যন্ত (VETLS) ভর্তুকিযুক্ত সুদের হারে ঋণ পাওয়া যায়। আপনি কোন কোর্সের জন্য আবেদন করতে চান?'
          : 'Based on your profile, here are the top NSFDC educational loan schemes available to you: the Educational Loan Scheme (ELS, up to ₹40 Lakhs at 6.50% interest) and the Vocational Education & Training Loan Scheme (VETLS, up to ₹4 Lakhs at 4.00% interest). Which course or degree are you planning to pursue, and what loan amount do you require?';
      } else {
        const topNames = schemes.slice(0, 2).map((s) => s.name).join(' and ');
        finalText = session.language === 'hi'
          ? (topNames ? \`आपकी आवश्यकता के अनुसार उपयुक्त सरकारी योजनाएं (\${topNames}) नीचे दी गई हैं। क्या आप अपने व्यवसाय या ऋण आवश्यकता के बारे में अधिक विवरण साझा कर सकते हैं?\` : 'आपकी आवश्यकता के अनुसार उपयुक्त योजनाएं नीचे प्रदर्शित की गई हैं।')
          : session.language === 'mr'
          ? (topNames ? \`तुमच्या गरजेनुसार योग्य सरकारी योजना (\${topNames}) खाली दिल्या आहेत. तुम्ही तुमच्या व्यवसायाबद्दल किंवा गरजेबद्दल अधिक माहिती देऊ शकता का?\` : 'तुमच्या गरजेनुसार योग्य योजना खाली दाखवल्या आहेत.')
          : session.language === 'bn'
          ? (topNames ? \`আপনার প্রয়োজনীয়তা অনুযায়ী উপযুক্ত সরকারি প্রকল্পগুলি (\${topNames}) নীচে দেওয়া হয়েছে।\` : 'আপনার প্রয়োজনীয়ता অনুযায়ী उपयुक्त প্রকল্পগুলি নীচে প্রদর্শিত হয়েছে।')
          : (topNames ? \`Based on your profile and requirement, here are the top matching government schemes: \${topNames}. Could you share more details about your specific project or funding need?\` : 'Here are the recommended schemes matching your inquiry.');
      }
      speechText = finalText;
    } else {
      finalText =
        session.language === 'hi'
          ? 'क्षमा करें, मुझे आपकी आवश्यकता समझने में कुछ कठिनाई हुई। कृपया बताएं कि आप किस व्यवसाय, शिक्षा या ऋण योजना के बारे में जानना चाहते हैं?'
          : session.language === 'mr'
          ? 'माफ करा, मला तुमची गरज समजण्यात अडचण आली. कृपया सांगा की तुम्हाला कोणत्या व्यवसाय, शिक्षण किंवा कर्ज योजनेबद्दल माहिती हवी आहे?'
          : session.language === 'bn'
          ? 'দুঃখিত, আমি আপনার প্রয়োজনীয়তা পুরোপুরি বুঝতে পারিনি। আপনি কি ধরনের শিক্ষা, ব্যবসা বা ঋণ প্রকল্প সম্পর্কে জানতে চান তা দয়া করে বলুন।'
          : "I couldn't quite understand your request. Could you please specify whether you are looking for an educational loan, business scheme, or specific assistance?";
      speechText = finalText;
    }
  }

  `;

content = content.slice(0, startIdx) + replacement + content.slice(endIdx);
fs.writeFileSync(targetFile, content, 'utf8');
console.log('Successfully updated ChatOrchestrator safety net block!');
