CREATE TABLE public.videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  num integer NOT NULL,
  title text NOT NULL DEFAULT '',
  stage text NOT NULL DEFAULT 'awareness',
  format text NOT NULL DEFAULT '',
  goal text NOT NULL DEFAULT '',
  hook text NOT NULL DEFAULT '',
  cta text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  priority boolean NOT NULL DEFAULT false,
  done boolean NOT NULL DEFAULT false,
  tasks jsonb NOT NULL DEFAULT '{}'::jsonb,
  script text NOT NULL DEFAULT '',
  extra_notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.videos TO authenticated;
GRANT ALL ON public.videos TO service_role;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in team can read" ON public.videos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Signed-in team can add" ON public.videos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Signed-in team can edit" ON public.videos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Signed-in team can delete" ON public.videos FOR DELETE TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER videos_touch BEFORE UPDATE ON public.videos FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.videos;

INSERT INTO public.videos (num,title,stage,format,goal,hook,cta,notes,priority) VALUES
(1,'DV-2027 Is Coming','awareness','Cinematic launch film','Introduce the campaign and create curiosity.','በየዓመቱ ብዙ ኢትዮጵያውያን የDV ምዝገባን ይጠብቃሉ… ግን ዘንድሮ ምን ማወቅ አለብን?','Follow for clear, verified updates.','Priority: shoot first. Use cinematic city, travel, and preparation visuals.',true),
(2,'DV-2027: What''s Actually Happening?','awareness','News-style presenter','Explain the current status without spreading rumors.','ስለ DV-2027 የምትሰሙት ሁሉ እውነት ነው?','Follow for verified updates.','Publish only after checking the latest official announcement.',false),
(3,'The $1 Problem','awareness','Cinematic problem-and-solution','Explain the payment barrier and clearly distinguish official fees from service fees.','አንድ ዶላር ብቻ ነው… ግን እንዴት ትከፍላለህ?','Comment with your payment questions.','Verify DV-2027 fee instructions before naming amounts. Do not imply the entry fee covers later visa processing.',true),
(4,'The Photo','awareness','Model + photo examples','Show why the official photo specifications matter.','ይህ ፎቶ ቆንጆ ነው… ግን ለDV ትክክል ነው?','Save this and check the official photo rules.','Use valid sample photos and current official specifications.',true),
(5,'What Happens After You Apply?','awareness','Timeline explainer','Explain confirmation, waiting, and checking results.','DV ሞልተሃል… ከዚያ ምን ይሆናል?','Save this for later.','Clarify that selection is not a visa guarantee.',false),
(6,'Your DV Preparation Checklist','preparation','Checklist / flat lay','Help viewers prepare before the registration period.','ምዝገባ ከመከፈቱ በፊት ምን ማዘጋጀት አለብህ?','Save the checklist.','Keep date-sensitive requirements clearly marked for verification.',true),
(7,'The Passport Question','preparation','Presenter explainer','Address passport questions accurately and avoid outdated assumptions.','ለDV ፓስፖርት ያስፈልጋል?','Comment with your question.','Verify the current DV-2027 official instructions before making a definitive claim.',true),
(8,'DV Photo: The Essential Checklist','preparation','Photo checklist demo','Explain size, background, framing, and validity.','ከመላክህ በፊት እነዚህን የፎቶ ነጥቦች አረጋግጥ።','Save and share with someone preparing.','Use the official photo tool/specifications where applicable.',true),
(9,'Who Can Qualify for DV?','preparation','Presenter + simple graphics','Explain education/work-experience eligibility at a high level.','ሁሉም ሰው ለDV ብቁ ነው?','Check the official instructions for your situation.','Eligibility rules can be technical; avoid oversimplifying individual cases.',false),
(10,'Your Family Information Matters','preparation','Family-details explainer','Explain why spouse and eligible children information must be accurate.','ስለ ቤተሰብህ የምትሞላው መረጃ ለምን አስፈላጊ ነው?','Review all details carefully.','Use current official instructions for spouse and child definitions.',false),
(11,'Common DV Mistakes','trust','Fast-cut explainer','Highlight preventable errors and careful review.','ትንሽ ስህተት ትልቅ ችግር ሊፈጥር ይችላል።','Save this before you apply.','Do not use unsupported rejection percentages or scare tactics.',false),
(12,'Can Someone Apply on Your Behalf?','trust','Two-person scenario','Explain the difference between receiving help and staying involved in the entry.','ሌላ ሰው በአንተ ምትክ ሊያመለክት ይችላል?','Ask us what our assistance includes.','Be precise about official rules and applicant review/participation.',false),
(13,'Protect Yourself from DV Scams','trust','Scenario / warning signs','Help viewers spot false promises and unsafe requests.','DV እንዳሸነፍክ ዋስትና የሚሰጥህ ሰው ካገኘህ ተጠንቀቅ።','Share this to help someone stay safe.','Never imply affiliation with the U.S. government.',false),
(14,'Your Confirmation Number Is Yours','trust','Screen demo / privacy','Explain why applicants should retain their confirmation number.','ይህን ቁጥር ካጣህ በኋላ ምን ይሆናል?','Keep your confirmation details secure.','Never ask viewers to post their confirmation number publicly.',false),
(15,'One Entry, Accurate Information','trust','Myth vs fact','Explain the duplicate-entry rule and why accuracy matters.','ብዙ ጊዜ ማመልከት እድልህን ይጨምራል?','Check the official rules before submitting.','State the duplicate-entry rule accurately; do not claim multiple entries improve odds.',false),
(16,'DV Selectees: The Real Story','community','Story / sourced facts','Share verified stories while distinguishing selection from visa issuance.','DV መመረጥ ማለት ቪዛ ማግኘት ማለት ነው?','Follow for realistic, useful guidance.','Verify any figures and identify their year and source. Selection does not guarantee a visa.',false),
(17,'DV vs. a Car Raffle','community','Probability explainer','Use a familiar comparison to explain chance carefully.','የDV እድልህን ከሎተሪ ጋር ማነጻጸር ይቻላል?','What comparison would make this clearer?','Only compare probabilities when sources and denominators are genuinely comparable.',false),
(18,'How Our DV Assistance Works','service','Service walkthrough','Explain the service process and set clear expectations.','ለDV ምዝገባ እገዛ እንዴት ይሰራል?','Message us to learn the steps and fees.','Clearly disclose service fees, official fees, privacy practices, and what applicants must review.',true),
(19,'Ask Us Anything About DV','community','Q&A / comment reply','Collect real audience questions and respond with sources.','ስለ DV የሚያሳስብህ ጥያቄ ምንድነው?','Drop your question below.','Do not request personal documents or sensitive details in public comments.',false),
(20,'Are You Ready for Registration?','community','Campaign recap / checklist','Recap preparation steps and direct viewers to verified official updates.','ምዝገባ ሲከፈት ዝግጁ ትሆናለህ?','Follow and save this final checklist.','Update the video if official dates or requirements change.',false);