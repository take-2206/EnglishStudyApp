import type { Topic } from "./types";
export const TOPICS: Topic[] = [
{ id:"pos", icon:"🔤", title:"Từ loại", ja:"品詞", summary:"Nhìn vị trí trong câu để chọn danh từ, tính từ, trạng từ hay động từ.",
  rules:[
    "Sau mạo từ (a, the) hoặc tính từ sở hữu (our, their) là **danh từ** (hoặc tính từ + danh từ): the **decision**, our **success**.",
    "Đứng trước danh từ là **tính từ**: a **reliable** supplier.",
    "Bổ nghĩa cho động từ, tính từ hoặc cả câu là **trạng từ** (đuôi -ly): review **carefully**, **highly** recommended.",
    "Sau to hoặc động từ khuyết thiếu (will, can, must) là **động từ nguyên mẫu**: must **follow**."],
  examples:[["The manager made a quick **decision**.","部長は素早い決断を下した。"],["Please review the contract **carefully**.","契約書を慎重に確認してください。"]],
  q:[
    {s:"The board approved the ___ of the new branch.",o:["open","opening","openly","opened"],a:1,e:"Sau 'the' và trước 'of' cần một danh từ: opening (việc khai trương)."},
    {s:"Ms. Tanaka is a highly ___ project manager.",o:["experience","experienced","experiencing","experiences"],a:1,e:"Trước danh từ 'project manager' cần tính từ: experienced (nhiều kinh nghiệm)."},
    {s:"All employees must ___ the safety guidelines.",o:["following","followed","follow","follows"],a:2,e:"Sau động từ khuyết thiếu 'must' dùng động từ nguyên mẫu: follow."},
    {s:"The new software runs ___ on older computers.",o:["smooth","smoothly","smoothness","smoothing"],a:1,e:"Bổ nghĩa cho động từ 'runs' cần trạng từ: smoothly."}] },
{ id:"tense", icon:"⏰", title:"Các thì", ja:"時制", summary:"Dựa vào từ chỉ thời gian (since, last year, next week...) để chọn thì đúng.",
  rules:[
    "**Hiện tại đơn**: sự thật, thói quen, lịch trình cố định: The train **leaves** at 9.",
    "**Hiện tại hoàn thành**: since, for, so far, recently, already, yet: We **have used** this supplier since 2018.",
    "**Quá khứ đơn**: yesterday, last year, ago: The company **moved** last year.",
    "**Tương lai** (will + V) cho hành động sắp tới. Trong mệnh đề với if, when, before, as soon as thì dùng **hiện tại đơn**, không dùng will."],
  examples:[["We **have used** this supplier since 2018.","当社は2018年からこの仕入れ先を利用しています。"],["If the shipment **arrives** on time, we will start production.","荷物が予定通りに届けば、生産を開始します。"]],
  q:[
    {s:"The company ___ its headquarters to Osaka last year.",o:["moves","moved","has moved","will move"],a:1,e:"'last year' chỉ thời điểm đã qua nên dùng quá khứ đơn: moved."},
    {s:"Sales ___ steadily since the campaign began.",o:["increase","increased","have increased","will increase"],a:2,e:"'since' + mốc thời gian trong quá khứ đi với hiện tại hoàn thành: have increased."},
    {s:"If the report ___ ready by Friday, we will send it to the client.",o:["is","will be","was","would be"],a:0,e:"Mệnh đề if chỉ tương lai dùng hiện tại đơn: is."},
    {s:"The conference ___ next Tuesday at 10 a.m.",o:["starts","started","has started","was starting"],a:0,e:"Lịch trình cố định dùng hiện tại đơn dù có 'next Tuesday': starts."}] },
{ id:"prep", icon:"📍", title:"Giới từ", ja:"前置詞", summary:"Phân biệt giới từ chỉ thời gian: at/on/in, by/until, during/for/within.",
  rules:[
    "**at** + giờ, điểm: at 9 a.m.; **on** + ngày, thứ: on Monday, on May 5; **in** + tháng, năm, mùa: in June, in 2026.",
    "**by** = không muộn hơn (hạn chót): by Friday. **until** = liên tục cho đến: until Friday.",
    "**during** + danh từ (sự kiện): during the meeting. **for** + khoảng thời gian: for three hours.",
    "**within** + khoảng thời gian = trong vòng: within 30 days."],
  examples:[["Please submit the form **by** Friday.","金曜日までにフォームを提出してください。"],["The store will stay open **until** 9 p.m.","店は午後9時まで開いています。"]],
  q:[
    {s:"The seminar will be held ___ March 12.",o:["in","at","on","by"],a:2,e:"Ngày cụ thể dùng 'on': on March 12."},
    {s:"Please return the signed contract ___ the end of the week.",o:["until","by","during","for"],a:1,e:"Hạn chót (không muộn hơn) dùng 'by'."},
    {s:"Several customers asked questions ___ the presentation.",o:["during","for","while","since"],a:0,e:"'during' + danh từ (the presentation). 'while' phải đi với mệnh đề."},
    {s:"Refunds are available ___ 30 days of purchase.",o:["within","during","at","on"],a:0,e:"'within' + khoảng thời gian = trong vòng 30 ngày."}] },
{ id:"conj", icon:"🔗", title:"Liên từ", ja:"接続詞", summary:"Phân biệt từ đi với mệnh đề (S + V) và từ đi với danh từ / V-ing.",
  rules:[
    "**although / even though** + mệnh đề (S + V). **despite / in spite of** + danh từ hoặc V-ing.",
    "**because** + mệnh đề. **because of / due to** + danh từ.",
    "**both A and B**, **either A or B**, **neither A nor B**, **not only A but also B**: các cặp liên từ phải đi đủ cặp.",
    "**while / whereas**: trong khi, diễn tả sự đối lập hoặc hai hành động song song."],
  examples:[["**Although** it rained, the event went ahead.","雨が降ったが、イベントは予定通り行われた。"],["The flight was delayed **because of** the storm.","嵐のため、フライトは遅れた。"]],
  q:[
    {s:"___ the heavy traffic, Mr. Lee arrived on time.",o:["Although","Despite","Because","However"],a:1,e:"Sau chỗ trống là cụm danh từ 'the heavy traffic' nên dùng 'Despite'."},
    {s:"The meeting was postponed ___ the manager was ill.",o:["because of","because","despite","due to"],a:1,e:"Sau chỗ trống là mệnh đề (the manager was ill) nên dùng 'because'."},
    {s:"___ the price is high, the product sells very well.",o:["Despite","In spite of","Although","Due to"],a:2,e:"Sau chỗ trống là mệnh đề và nghĩa nhượng bộ nên dùng 'Although'."},
    {s:"You can pay ___ by credit card or in cash.",o:["both","either","neither","whether"],a:1,e:"Cặp 'either ... or ...': hoặc ... hoặc ..."}] },
{ id:"rel", icon:"🧩", title:"Mệnh đề quan hệ", ja:"関係詞", summary:"Chọn đại từ quan hệ dựa vào danh từ đứng trước và vai trò trong mệnh đề.",
  rules:[
    "**who**: chỉ người, làm chủ ngữ: the employee **who** called. **which**: chỉ vật. **that**: người hoặc vật, nhưng không dùng sau dấu phẩy.",
    "**whose** + danh từ: sở hữu: a company **whose** profits rose.",
    "**whom**: người, làm tân ngữ, có thể đứng sau giới từ: the client to **whom** we wrote.",
    "**where**: nơi chốn; **when**: thời gian."],
  examples:[["The candidate **who** interviewed yesterday accepted the offer.","昨日面接を受けた候補者が内定を受け入れた。"],["This is the office **where** the team works.","ここがチームが働いているオフィスです。"]],
  q:[
    {s:"The applicant ___ resume impressed us was hired.",o:["who","whom","whose","which"],a:2,e:"Chỗ trống + danh từ 'resume' thể hiện sở hữu (hồ sơ của người đó): whose."},
    {s:"The report, ___ was submitted yesterday, contains errors.",o:["that","which","who","whose"],a:1,e:"Sau dấu phẩy không dùng 'that'. Chỉ vật, làm chủ ngữ: which."},
    {s:"We visited the factory ___ the products are made.",o:["where","which","who","whose"],a:0,e:"Danh từ chỉ nơi chốn (factory) và mệnh đề sau đã đủ chủ ngữ, động từ: where."},
    {s:"Ms. Kim is the manager ___ leads the sales team.",o:["who","whom","whose","where"],a:0,e:"Chỉ người, làm chủ ngữ của 'leads': who."}] },
{ id:"pass", icon:"🔁", title:"Bị động và phân từ", ja:"受動態・分詞", summary:"Bị động dùng be + V3. Phân từ V-ing mang nghĩa chủ động, V-ed mang nghĩa bị động.",
  rules:[
    "**Bị động**: be + V3/ed: The report **was completed** by the team.",
    "Sau động từ khuyết thiếu: will **be** + V3, must **be** + V3: All requests must **be submitted**.",
    "**V-ed** bổ nghĩa cho danh từ bị tác động: a **damaged** package, the **revised** documents.",
    "**V-ing** bổ nghĩa cho danh từ thực hiện hành động: the person **handling** the request."],
  examples:[["The invoices will **be sent** tomorrow.","請求書は明日送付されます。"],["The package **damaged** during shipping was replaced.","輸送中に破損した荷物は交換された。"]],
  q:[
    {s:"The new policy ___ by the board last month.",o:["approved","was approved","has approving","approves"],a:1,e:"Chính sách 'được' phê duyệt (bị động) và có 'last month': was approved."},
    {s:"All requests must ___ before the deadline.",o:["submit","be submitted","submitting","submitted"],a:1,e:"Sau 'must' dùng be + V3 vì các yêu cầu 'được' nộp: be submitted."},
    {s:"The ___ documents were sent back to the client.",o:["revise","revising","revised","revises"],a:2,e:"Tài liệu 'được' chỉnh sửa (nghĩa bị động) nên dùng V-ed: revised."},
    {s:"Employees ___ the training program will receive a certificate.",o:["complete","completing","completed","completes"],a:1,e:"Nhân viên là người thực hiện việc hoàn thành (nghĩa chủ động) nên dùng V-ing: completing."}] }
];
