const GreetingHandler = require('./greetingHandler');
const SmallTalkHandler = require('./smallTalkHandler');
const SearchHandler = require('./searchHandler');
const ReferenceHandler = require('./referenceHandler');
const PaginationHandler = require('./paginationHandler');
const OpinionHandler = require('./opinionHandler');
const RecallHandler = require('./recallHandler');
const ProfileHandler = require('./profileHandler');
const AIChatHandler = require('./aiChatHandler');

module.exports = [
  new GreetingHandler(),
  new SmallTalkHandler(),
  new ProfileHandler(),
  new SearchHandler(),
  new ReferenceHandler(),
  new PaginationHandler(),
  new OpinionHandler(),
  new RecallHandler(),
  new AIChatHandler(),
];
